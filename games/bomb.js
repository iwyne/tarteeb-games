// القنبلة: معك مقطع حرفين، اكتب كلمة فيها المقطع قبل لا تنفجر القنبلة بيدك.
// القاموس (bomb-words.txt.gz) من قائمة تكرار كلمات عربية (FrequencyWords، ترجمات أفلام)، وينحمّل أول ما تبدأ لعبة.
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const TASH = /[ً-ْـٰ]/g;
const n1 = w => String(w || '').replace(TASH, '').replace(/[أإآٱ]/g, 'ا').replace(/\s+/g, '');
const n2 = w => n1(w).replace(/ة/g, 'ه').replace(/ى/g, 'ي');
const ARW = /^[ء-غف-ي]+$/;
const BONUS = [...'ابتجحدرسشعفقكلمنهويص']; // حروف المكافأة: تكمّلها كلها تاخذ قلب
let DICT = null, SYL = null, BOTW = null;
function load() {
  if (DICT) return;
  DICT = new Set(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'bomb-words.txt.gz'))).toString('utf8').split('\n'));
  SYL = JSON.parse(fs.readFileSync(path.join(__dirname, 'bomb-syl.json'), 'utf8'));
  for (const k of ['easy', 'mid', 'hard']) SYL[k] = SYL[k].filter(s => s !== 'ال' && s !== 'لل');
  const BAD = /(مثلي|ذبح|قتل|جنس|عاهر|سافل|حقير|لعن|كلب|حمار|غبي|اغتصا|خمر|نيك|زب|طيز|شرموط|قحب)/;
  BOTW = SYL.common.slice(0, 9000).filter(w => !BAD.test(w));
  delete SYL.common;
  EXTRA.split(/\s+/).forEach(w => w && DICT.add(n2(w)));
}
// كلمات خليجية وسعودية يومية ما تطلع كثير بالترجمات
const EXTRA = `دلة دله فنجال فناجيل بيالة استكانة كبسة مندي مظبي مضغوط جريش قرصان مرقوق مطازيز سليق هريس عصيدة لقيمات بلاليط خبيصة معصوب مطبق سمبوسة شاورما فلافل كنافة بسبوسة قهوة شاهي حليب لبن روب زبادي تمر رطب خلاص سكري برحي نخل نخلة عسيب خوص سعف مزرعة استراحة شبة مجلس ديوانية مشب كشتة كشته طلعة مخيم بر دبة جيب هايلكس كامري شاص وانيت دباب دباب سيكل بلوت كوت صن حكم سرا مشروع بلوتيه كيرم دومينو بلايستيشن سوني فيفا قيمر قيمنق ستريم ديسكورد سناب تيك تويتر واتساب جوال جوالات شاحن سماعة سماعات لابتوب تابلت راوتر نت شريحة باقة رصيد شماغ غترة عقال بشت ثوب ثياب دقلة كندورة عباية عبايات نقاب طرحة شيلة جلابية نعال زبيرية شبشب كوت جاكيت هودي بنطلون اسوارة خاتم دبلة مسباح سبحة بخور عود دهن معمول مبخرة مرش طيب ريحة سالفة سوالف علوم هرجة سواليف يبه يمه يبا يما خوي خويي اخوي ربع ربعي شلة شله عيال عيالي بزر بزارين ياهل يهال جدة جدتي جدي عمي خالي ولد بنت حرمة رجال شايب عجوز عيد عيدية عساكم حياك هلا مرحبا مسا صباح يعطيك العافية الله ابشر ابشري تامر سم لبيه هلا والله وش ايش شلون كيف ليش ليه وين متى منو مين كم ابي ابغى ابغا ودي ابيه ابغاه ابغاها ودك تبي تبغى يبي يبغى نبي نبغى زين زينة حلو حلوة كشخة كشخه مزيون مزيونة خايس خايسة طفش طفشان زهق زهقان مليت مستانس وناسة فلة فلة ضحك هههه سحبة سحب طنش طنشني هبال هبل خبل خبلة دلوع دلوعة سنافي سنافة نشبة نشبه هوشة هوشه زعلان زعلانة مطنوخ شطور شاطر فاهي داشر ملقوف لقافة نحيس فلوس بيزات هلل ريال ريالات جيب سياكل ثلاجة غسالة مكيف مكيفات مروحة دافور فرن صحن صحون ملاعق ملعقة سكين سكاكين قدر قدور ابريق ترمس طاسة طوسة كاسة كاسات كوب اكواب صينية سفرة زولية زوالي موكيت كنب كنبة مرتبة مخدة لحاف بطانية دولاب كبت درج دروج ستارة ستاير باب بيبان شباك دريشة دراريش سطح حوش مقلط مطبخ حمام دورة مويه موية ماي مي ثلج دفا برد حر غبار عجاج سموم مطر مطرة سيل سيول وادي شعيب نفود طعس رمل كثبان جبل جبال ضلع ضلوع حزم صحراء بحر شاطي سيف خور جون قارب طراد لنش هوري صقر صقور شاهين حر حرار طير طيور حمام حمامة قطو قطوة قطاوة بسة بسه كلب كلاب جمل ابل ناقة حاشي قعود هجن مطية خروف خرفان طلي طليان نعجة تيس غنم ماعز معزى بقرة ثور حصان خيل فرس مهرة دجاج دياية ديك بيض بيضة سمك هامور كنعد شعري صافي بياح زبيدي روبيان قبقب`;
// كلمة صحيحة؟ موجودة بالقاموس، أو بعد ما نشيل سابقة/لاحقة شائعة
const PRE = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ف', 'ب', 'ل', 'ك', 'س'];
const SUF = ['هما', 'كما', 'ها', 'هم', 'هن', 'كم', 'كن', 'نا', 'ات', 'ون', 'ين', 'ان', 'ه', 'ي', 'ك'];
function valid(w) {
  const k = n2(w); if (DICT.has(k)) return true;
  const cands = [k];
  for (const p of PRE) if (k.startsWith(p) && k.length - p.length >= 2) cands.push(k.slice(p.length));
  for (const c of cands.slice()) for (const s of SUF) if (c.endsWith(s) && c.length - s.length >= 3) cands.push(c.slice(0, -s.length));
  return cands.some(c => c.length >= 2 && DICT.has(c));
}
const rnd = n => Math.random() * n | 0;
const SCALE = +process.env.BOMB_SCALE || 1;
module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  const alive = g => g.order.filter(id => g.P[id] && g.P[id].lives > 0);
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }
  function newSyl(g) {
    const pool = SYL[g.diff === 'hard' ? 'hard' : g.diff === 'easy' ? 'easy' : 'mid'].concat(g.diff === 'hard' ? SYL.mid : g.diff === 'easy' ? [] : SYL.easy.slice(0, 20));
    let s; do s = pool[rnd(pool.length)]; while (s === g.syl && pool.length > 1);
    g.syl = s; g.sylN++;
  }
  function arm(r) { // فتيل جديد بعد كل انفجار، ما يدري أحد متى
    const g = r.g; g.armAt = Date.now(); g.fuse = g.armAt + (12000 + rnd(16000)) * SCALE;
    tick(r);
  }
  function tick(r) {
    const g = r.g; clearTimeout(g.ft);
    const ms = Math.max(0, g.fuse - Date.now());
    g.ft = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; boom(r); H.push(r); }, ms);
  }
  function giveTo(r, id) {
    const g = r.g; g.turn = id; g.typed = ''; g.turnAt = Date.now();
    // كل واحد ياخذ ٤ ثواني على الأقل
    if (g.fuse - Date.now() < 4000 * SCALE) { g.fuse = Date.now() + 4000 * SCALE; tick(r); }
    botMove(r);
  }
  function nextId(g, from) {
    const a = alive(g); if (!a.length) return null;
    const i = g.order.indexOf(from);
    for (let k = 1; k <= g.order.length; k++) { const id = g.order[(i + k) % g.order.length]; if (g.P[id].lives > 0) return id; }
    return null;
  }
  function boom(r) {
    const g = r.g, P = g.P[g.turn]; if (!P) return;
    P.lives--; g.booms++;
    g.ev = { k: 'boom', id: g.turn, n: g.booms, syl: g.syl };
    H.log(r, `💥 انفجرت بيد ${(byId(r, g.turn) || {}).name || '؟'}`);
    const a = alive(g);
    if (a.length <= 1) return end(r, a[0]);
    newSyl(g); arm(r);
    giveTo(r, nextId(g, g.turn));
  }
  function end(r, winId) {
    const g = r.g; clearTimeout(g.ft); g.bt.forEach(clearTimeout); g.sub = 'end';
    r.phase = 'over';
    const w = winId && byId(r, winId);
    r.winner = w ? w.name : 'انتهت اللعبة'; r.winTeam = null;
    if (w) H.win(r, [w]);
    H.setTimer(r, 0, null);
  }
  function word(r, p, v) {
    const g = r.g; if (g.turn !== p.id || g.sub !== 'play') return;
    const raw = String(v || '').trim().slice(0, 24), w = n1(raw);
    const bad = why => { g.typed = raw; H.cast(r, { t: 'gnet', g: 'bomb', k: 'bad', id: p.id, v: raw, why }); return 'quiet'; };
    if (!w || !ARW.test(w)) return bad('حروف عربية بس');
    if (w.length < 3) return bad('قصيرة');
    if (!w.includes(g.syl)) return bad(`ما فيها «${g.syl}»`);
    const k = n2(w);
    if (g.used.has(k)) return bad('انكتبت قبل!');
    if (!valid(w)) return bad('ما عرفتها 🤔');
    g.used.add(k);
    const P = g.P[p.id]; P.words++;
    if (w.length > (P.best || '').length) P.best = w;
    let bonus = false;
    for (const ch of new Set(w)) if (BONUS.includes(ch) && !P.let.includes(ch)) P.let.push(ch);
    if (P.let.length >= BONUS.length) { P.let = []; if (P.lives < g.maxL) { P.lives++; bonus = true; } }
    g.ev = { k: 'ok', id: p.id, w: raw, n: ++g.okN, bonus };
    if (g.last.length > 6) g.last.shift(); g.last.push({ id: p.id, w: raw });
    newSyl(g);
    giveTo(r, nextId(g, p.id));
  }
  function botMove(r) {
    const g = r.g, b = byId(r, g.turn); if (!b || !b.bot || g.sub !== 'play') return;
    const turn = g.turnAt, syl = g.syl;
    const opts = BOTW.filter(w => w.includes(syl) && !g.used.has(n2(w)));
    const fail = !opts.length || Math.random() < .12;
    const w = fail ? null : opts[rnd(Math.min(opts.length, 60))];
    const think = (1200 + rnd(2600)) * SCALE;
    if (w) [...w].forEach((_, i) => later(r, think + i * 140 * SCALE, () => { if (g.turnAt === turn) H.cast(r, { t: 'gnet', g: 'bomb', k: 'type', id: b.id, v: w.slice(0, i + 1) }); }));
    later(r, think + (w ? w.length * 140 + 300 : 0) * SCALE, () => { if (g.turnAt !== turn) return; if (w) word(r, b, w); });
  }
  return {
    min: 2, max: 12,
    start(r) {
      load();
      const order = H.shuffle(r.players.map(p => p.id)), lives = [2, 3, 4].includes(r.opts.blives) ? r.opts.blives : 3;
      const P = {}; order.forEach(id => { P[id] = { lives, words: 0, let: [], best: '' }; });
      r.g = { order, P, maxL: lives, diff: ['easy', 'mid', 'hard'].includes(r.opts.bdiff) ? r.opts.bdiff : 'mid', sub: 'intro', syl: '', sylN: 0, used: new Set(), turn: null, typed: '', turnAt: 0, fuse: 0, ft: null, bt: [], booms: 0, okN: 0, ev: null, last: [] };
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, 'اكتب كلمة فيها المقطع قبل لا تنفجر!');
      H.setTimer(r, 3500 * SCALE, () => { const g = r.g; g.sub = 'play'; newSyl(g); arm(r); giveTo(r, g.order[0]); H.setTimer(r, 0, null); });
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (m.t === 'btype') {
        if (g.turn !== p.id || g.sub !== 'play' || !H.rate(p, 'bt', 60)) return 'quiet';
        g.typed = String(m.v || '').slice(0, 24);
        H.cast(r, { t: 'gnet', g: 'bomb', k: 'type', id: p.id, v: g.typed }, p);
        return 'quiet';
      }
      if (m.t === 'bword') { if (!H.rate(p, 'bw', 150)) return 'quiet'; return word(r, p, m.v); }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      return {
        sub: g.sub, order: g.order, P: g.P, syl: g.syl, sylN: g.sylN, turn: g.turn, typed: g.typed, ev: g.ev, maxL: g.maxL, bonus: BONUS, last: g.last, diff: g.diff,
        // إحساس بالوقت بدون ما نكشفه: كم مر من أول الفتيل (مو كم باقي)
        heat: g.armAt ? Math.min(1, (Date.now() - g.armAt) / (28000 * SCALE)) : 0
      };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      if (g.P[p.id]) g.P[p.id].lives = 0;
      const a = alive(g);
      if (a.length <= 1) return end(r, a[0]);
      if (g.turn === p.id && g.sub === 'play') { newSyl(g); giveTo(r, nextId(g, p.id)); }
    },
    _valid: w => { load(); return valid(w); }, _n1: n1
  };
};
