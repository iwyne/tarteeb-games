// محرّك شطرنج صغير للبوت (0x88): توليد حركات سريع، alpha-beta مع تعميق تدريجي، وبحث الأكل (quiescence).
// القواعد الرسمية للعبة نفسها من chess.js، وهذا بس عشان البوت يفكّر بسرعة.
// يشتغل داخل worker_thread عشان ما يوقف السيرفر.
const { parentPort } = require('worker_threads');
const N = -16, S = 16, E = 1, W = -1;
const KN = [33, 31, 18, 14, -33, -31, -18, -14], KG = [17, 15, -17, -15, 16, -16, 1, -1], BD = [17, 15, -17, -15], RD = [16, -16, 1, -1];
const VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
// جداول المواقع (من منظور الأبيض، الصف ٨ أول)
const PST = {
  P: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  N: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  B: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  R: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  Q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  K: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
  KE: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50]
};
const isW = p => p && p === p.toUpperCase();
const sqName = s => 'abcdefgh'[s & 7] + (8 - (s >> 4));
const sqIdx = n => (8 - +n[1]) * 16 + 'abcdefgh'.indexOf(n[0]);
function parse(fen) {
  const [b, t, c, ep] = fen.split(' '), B = new Array(128).fill(null);
  let r = 0, f = 0;
  for (const ch of b) { if (ch === '/') { r++; f = 0; } else if (/\d/.test(ch)) f += +ch; else { B[r * 16 + f] = ch; f++; } }
  return { B, w: t === 'w', c: c === '-' ? '' : c, ep: ep === '-' ? -1 : sqIdx(ep) };
}
function attacked(B, sq, byW) {
  const P = byW ? 'P' : 'p', Nn = byW ? 'N' : 'n', Bb = byW ? 'B' : 'b', R = byW ? 'R' : 'r', Q = byW ? 'Q' : 'q', K = byW ? 'K' : 'k';
  for (const d of byW ? [15, 17] : [-15, -17]) { const s = sq + d; if (!(s & 0x88) && B[s] === P) return true; }
  for (const d of KN) { const s = sq + d; if (!(s & 0x88) && B[s] === Nn) return true; }
  for (const d of KG) { const s = sq + d; if (!(s & 0x88) && B[s] === K) return true; }
  for (const d of BD) for (let s = sq + d; !(s & 0x88); s += d) { const p = B[s]; if (p) { if (p === Bb || p === Q) return true; break; } }
  for (const d of RD) for (let s = sq + d; !(s & 0x88); s += d) { const p = B[s]; if (p) { if (p === R || p === Q) return true; break; } }
  return false;
}
// كل الحركات القانونية: [من، إلى، ترقية، أكل]
function gen(st, capsOnly) {
  const { B, w } = st, out = [];
  const push = (f, t, pr) => out.push([f, t, pr || '', B[t] ? VAL[B[t].toUpperCase()] : (pr ? 0 : t === st.ep && B[f].toUpperCase() === 'P' ? 100 : 0)]);
  for (let f = 0; f < 128; f++) {
    if (f & 0x88) { f += 7; continue; }
    const p = B[f]; if (!p || isW(p) !== w) continue;
    const u = p.toUpperCase();
    if (u === 'P') {
      const d = w ? N : S, last = w ? 0 : 7, start = w ? 6 : 1, t = f + d;
      if (!capsOnly && !(t & 0x88) && !B[t]) {
        if (t >> 4 === last) ['Q', 'N', 'R', 'B'].forEach(pr => push(f, t, pr)); else { push(f, t); if (f >> 4 === start && !B[t + d]) push(f, t + d); }
      }
      for (const dd of [d + 1, d - 1]) { const c = f + dd; if (c & 0x88) continue; if ((B[c] && isW(B[c]) !== w) || c === st.ep) { if (c >> 4 === last) ['Q', 'N', 'R', 'B'].forEach(pr => push(f, c, pr)); else push(f, c); } }
      if (capsOnly && !(t & 0x88) && !B[t] && t >> 4 === last) push(f, t, 'Q');
    } else if (u === 'N' || u === 'K') {
      for (const d of u === 'N' ? KN : KG) { const t = f + d; if (t & 0x88) continue; if (!B[t] || isW(B[t]) !== w) { if (!capsOnly || B[t]) push(f, t); } }
      if (u === 'K' && !capsOnly) {
        const r = w ? 7 : 0, k = r * 16 + 4;
        if (f === k && !attacked(B, k, !w)) {
          if (st.c.includes(w ? 'K' : 'k') && !B[k + 1] && !B[k + 2] && B[k + 3] === (w ? 'R' : 'r') && !attacked(B, k + 1, !w) && !attacked(B, k + 2, !w)) push(f, k + 2);
          if (st.c.includes(w ? 'Q' : 'q') && !B[k - 1] && !B[k - 2] && !B[k - 3] && B[k - 4] === (w ? 'R' : 'r') && !attacked(B, k - 1, !w) && !attacked(B, k - 2, !w)) push(f, k - 2);
        }
      }
    } else {
      for (const d of u === 'B' ? BD : u === 'R' ? RD : KG) for (let t = f + d; !(t & 0x88); t += d) { if (B[t]) { if (isW(B[t]) !== w) push(f, t); break; } if (!capsOnly) push(f, t); }
    }
  }
  // نشيل اللي يخلي ملكك مكشوف
  return out.filter(m => { const n = make(st, m); return !attacked(n.B, n.B.indexOf(w ? 'K' : 'k'), !w); });
}
function make(st, [f, t, pr]) {
  const B = st.B.slice(), p = B[f], u = p.toUpperCase(), w = st.w; let c = st.c, ep = -1;
  if (u === 'P' && t === st.ep) B[t + (w ? S : N)] = null;
  if (u === 'P' && Math.abs(t - f) === 32) ep = (f + t) / 2;
  if (u === 'K' && Math.abs(t - f) === 2) { if (t > f) { B[t - 1] = B[t + 1]; B[t + 1] = null; } else { B[t + 1] = B[t - 2]; B[t - 2] = null; } }
  B[t] = pr ? (w ? pr : pr.toLowerCase()) : p; B[f] = null;
  if (c) {
    if (u === 'K') c = c.replace(w ? /[KQ]/g : /[kq]/g, '');
    for (const [sq, ch] of [[0x77, 'K'], [0x70, 'Q'], [0x07, 'k'], [0x00, 'q']]) if (f === sq || t === sq) c = c.replace(ch, '');
  }
  return { B, w: !w, c, ep };
}
function evaluate(st) {
  let s = 0, mat = 0;
  for (let i = 0; i < 128; i++) { if (i & 0x88) { i += 7; continue; } const p = st.B[i]; if (p && p.toUpperCase() !== 'P' && p.toUpperCase() !== 'K') mat += VAL[p.toUpperCase()]; }
  const endg = mat <= 1300;
  for (let i = 0; i < 128; i++) {
    if (i & 0x88) { i += 7; continue; }
    const p = st.B[i]; if (!p) continue;
    const u = p.toUpperCase(), white = isW(p), idx = (i >> 4) * 8 + (i & 7), mi = white ? idx : (7 - (i >> 4)) * 8 + (i & 7);
    const v = VAL[u] + (u === 'K' && endg ? PST.KE : PST[u])[mi];
    s += white ? v : -v;
  }
  return st.w ? s : -s;
}
const MATE = 100000;
function search(fen, opts = {}) {
  const root = parse(fen), deadline = Date.now() + (opts.ms || 800), maxD = opts.depth || 4;
  let nodes = 0, stop = false;
  const order = ms => ms.sort((a, b) => (b[3] + (b[2] ? 800 : 0)) - (a[3] + (a[2] ? 800 : 0)));
  function qs(st, a, b, d) {
    if ((++nodes & 1023) === 0 && Date.now() > deadline) stop = true;
    const sp = evaluate(st); if (sp >= b) return b; if (sp > a) a = sp; if (d > 6) return a;
    for (const m of order(gen(st, true))) { const v = -qs(make(st, m), -b, -a, d + 1); if (stop) return 0; if (v >= b) return b; if (v > a) a = v; }
    return a;
  }
  function ab(st, d, a, b, ply) {
    if ((++nodes & 1023) === 0 && Date.now() > deadline) stop = true;
    const ms = gen(st);
    if (!ms.length) return attacked(st.B, st.B.indexOf(st.w ? 'K' : 'k'), !st.w) ? -MATE + ply : 0;
    if (d <= 0) return qs(st, a, b, 0);
    for (const m of order(ms)) { const v = -ab(make(st, m), d - 1, -b, -a, ply + 1); if (stop) return 0; if (v >= b) return b; if (v > a) a = v; }
    return a;
  }
  let moves = order(gen(root)), best = moves[0], scores = [];
  for (let d = 1; d <= maxD && !stop; d++) {
    const sc = [];
    for (const m of moves) { const v = -ab(make(root, m), d - 1, -MATE, MATE, 1); if (stop) break; sc.push([m, v]); }
    if (stop && sc.length < moves.length) break;
    sc.sort((x, y) => y[1] - x[1]); scores = sc; best = sc[0][0]; moves = sc.map(x => x[0]);
    if (Math.abs(sc[0][1]) > MATE - 100) break;
  }
  // المستوى السهل: يختار عشوائي من الحركات القريبة من الأفضل، وأحياناً يغلط
  if (opts.noise && scores.length > 1) {
    const ok = scores.filter(s => s[1] >= scores[0][1] - opts.noise);
    best = ok[Math.random() * ok.length | 0][0];
  }
  return best && { from: sqName(best[0]), to: sqName(best[1]), promotion: best[2] ? best[2].toLowerCase() : undefined, nodes };
}
if (parentPort) parentPort.on('message', ({ id, fen, opts }) => { let r = null; try { r = search(fen, opts); } catch (e) { r = null; } parentPort.postMessage({ id, move: r }); });
module.exports = { search, parse, gen, make, sqName };
