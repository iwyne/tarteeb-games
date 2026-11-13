// الأصوات الترتيب: اسمع ← قلّد بالمايك ← العجلة ← تنعاد التسجيلات
// التقييم على الجهاز: نقارن شكل الصوت (العلو والإيقاع) واللحن (طلوع ونزول الطبقة، مو الطبقة نفسها) والطول.
const MM = { ac: null, stream: null, refs: {}, takes: {}, round: 0, sub: '', recFor: '', played: '', pi: -2, an: null, raf: 0 };
const mmAC = () => MM.ac || (MM.ac = new (window.AudioContext || window.webkitAudioContext)());
async function mmMic() {
  if (MM.stream && MM.stream.active) return MM.stream;
  MM.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  return MM.stream;
}
// ---------- تحليل الصوت ----------
// لكل إطار (١٦ms): العلو، والطبقة بطريقة YIN (تتجنب غلط الأوكتاف)
function mmFeat(buf) {
  const sr = buf.sampleRate, x = buf.getChannelData(0), N = 2048, W = 1024, hop = Math.round(sr * .016), out = { e: [], p: [] };
  const tmin = Math.floor(sr / 1100), tmax = Math.min(W - 1, Math.floor(sr / 70)), d = new Float32Array(tmax + 1);
  for (let i = 0; i + N < x.length; i += hop) {
    let s = 0; for (let k = 0; k < W; k++) s += x[i + k] * x[i + k];
    const rms = Math.sqrt(s / W); out.e.push(rms);
    let f0 = null;
    if (rms > .008) {
      d[0] = 1; let run = 0;
      for (let t = 1; t <= tmax; t++) { let v = 0; for (let k = 0; k < W; k += 2) { const q = x[i + k] - x[i + k + t]; v += q * q; } run += v; d[t] = run ? v * t / run : 1; }
      for (let t = tmin; t < tmax; t++) if (d[t] < .2) { while (t + 1 < tmax && d[t + 1] < d[t]) t++; f0 = sr / t; break; }
    }
    out.p.push(f0 ? 12 * Math.log2(f0 / 100) : null);
  }
  const mx = Math.max(...out.e, 1e-6), on = out.e.map(v => v > mx * .1);
  const a = on.indexOf(true), b = on.lastIndexOf(true); if (a < 0) return null;
  const e = out.e.slice(a, b + 1).map(v => v / mx), p = out.p.slice(a, b + 1);
  // اللحن نسبي: نطرح الوسيط، عشان الصوت الخشن والناعم سوا
  const vp = p.filter(v => v != null).sort((m, n) => m - n), cut = Math.floor(vp.length * .1), mid = vp.slice(cut, vp.length - cut), med = mid.length ? mid.reduce((m, v) => m + v, 0) / mid.length : 0;
  return { e, p: p.map(v => v == null ? null : v - med), dur: (b - a + 1) * hop / sr, voiced: vp.length / p.length };
}
const mmRes = (arr, n) => Array.from({ length: n }, (_, i) => arr[Math.min(arr.length - 1, Math.floor(i / n * arr.length))]);
// مقارنة بمرونة بالتوقيت (DTW): لو تأخرت شوي أو سرّعت بنص الصوت ما ينحسب عليك كثير
function mmScore(ref, me) {
  if (!ref || !me) return 0;
  const n = 60, er = mmRes(ref.e, n), em = mmRes(me.e, n), pr = mmRes(ref.p, n), pm = mmRes(me.p, n), w = 12;
  const tonal = ref.voiced > .3, we = tonal ? .4 : .85, wp = 1 - we;
  const cost = (i, j) => { const ce = Math.abs(er[i] - em[j]); let cp; if (pr[i] != null && pm[j] != null) cp = Math.min(1, Math.abs(pr[i] - pm[j]) / 5); else if (pr[i] != null || pm[j] != null) cp = tonal ? .7 : .2; else cp = 0; return we * ce + wp * cp; };
  const D = Array.from({ length: n + 1 }, () => new Float32Array(n + 1).fill(1e9)), L = Array.from({ length: n + 1 }, () => new Uint16Array(n + 1)); D[0][0] = 0;
  for (let i = 1; i <= n; i++) for (let j = Math.max(1, i - w); j <= Math.min(n, i + w); j++) {
    const c = cost(i - 1, j - 1); let b = D[i - 1][j - 1], l = L[i - 1][j - 1];
    if (D[i - 1][j] < b) { b = D[i - 1][j]; l = L[i - 1][j]; } if (D[i][j - 1] < b) { b = D[i][j - 1]; l = L[i][j - 1]; }
    D[i][j] = b + c; L[i][j] = l + 1;
  }
  const avg = D[n][n] / Math.max(1, L[n][n]), sim = Math.max(0, 1 - avg / .42);
  const dSim = Math.max(0, 1 - Math.abs(Math.log((me.dur + .05) / (ref.dur + .05))) * 1.1);
  const raw = sim * .84 + dSim * .16;
  return Math.round(Math.max(0, Math.min(100, (raw - .18) / .74 * 100)));
}
async function mmRef(snd) {
  if (MM.refs[snd.id]) return MM.refs[snd.id];
  const r = await fetch('mimic/' + snd.file + '?v=' + MMV).then(x => x.arrayBuffer()), buf = await mmAC().decodeAudioData(r);
  return (MM.refs[snd.id] = { buf, f: mmFeat(buf) });
}
function mmPlayBuf(buf, vol = 1) { const ac = mmAC(), s = ac.createBufferSource(), g = ac.createGain(); g.gain.value = vol * (typeof sfx === 'function' && sfx.vol ? Math.max(.3, sfx.vol()) : 1); s.buffer = buf; s.connect(g).connect(ac.destination); s.start(); return s; }
// صوت الفسوة 💨 (مركّب)
function mmFart() {
  const ac = mmAC(), t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(55, t + .9);
  const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 23; lg.gain.value = 30; lfo.connect(lg).connect(o.frequency);
  f.type = 'lowpass'; f.frequency.value = 600; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.6, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + 1);
  o.connect(f).connect(g).connect(ac.destination); o.start(t); lfo.start(t); o.stop(t + 1); lfo.stop(t + 1);
}
// ---------- التسجيل ----------
async function mmRecord(snd, round) {
  const key = round + ':' + snd.id; if (MM.recFor === key) return; MM.recFor = key;
  const st = $('#mmStage');
  let stream;
  try { stream = await mmMic(); } catch { mmMsg('ما قدرنا نوصل للمايك 🎙️ اسمح له من إعدادات المتصفح', 'bad'); send({ t: 'mtake', a: '', s: 0 }); return; }
  for (const n of ['٣', '٢', '١']) { if (MM.round !== round) return; mmCount(n); try { sfx('tick'); } catch {} await new Promise(r => setTimeout(r, 1000)); }
  mmCount('قلّد! 🎙️', 'go');
  const types = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];
  const type = types.find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
  const rec = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined), chunks = [];
  rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  mmMeter(stream, true);
  rec.start();
  await new Promise(r => setTimeout(r, snd.dur * 1000 + 700));
  rec.stop(); await new Promise(r => rec.onstop = r);
  mmMeter(null, false); mmCount('');
  const blob = new Blob(chunks, { type: rec.mimeType || type });
  let s = 0;
  try { const buf = await mmAC().decodeAudioData(await blob.arrayBuffer()); const ref = await mmRef(snd); s = mmScore(ref.f, mmFeat(buf)); } catch (e) { console.warn(e); }
  const a = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(blob); });
  if (MM.round === round) { send({ t: 'mtake', a, s, mime: blob.type }); mmMsg('سلّمت ✔ ننتظر الباقين…'); }
}
function mmMeter(stream, on) {
  cancelAnimationFrame(MM.raf); const cv = $('#mmMeter'); if (!cv) return;
  if (!on) { cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); return; }
  const ac = mmAC(), src = ac.createMediaStreamSource(stream), an = ac.createAnalyser(); an.fftSize = 256; src.connect(an);
  const d = new Uint8Array(an.frequencyBinCount), ctx = cv.getContext('2d');
  (function f() { an.getByteFrequencyData(d); ctx.clearRect(0, 0, cv.width, cv.height); const w = cv.width / 32; for (let i = 0; i < 32; i++) { const h = d[i * 2] / 255 * cv.height; ctx.fillStyle = i % 2 ? '#ff4fa3' : '#ffd34d'; ctx.fillRect(i * w + 1, (cv.height - h) / 2, w - 2, h || 2); } MM.raf = requestAnimationFrame(f); })();
}
const mmCount = (t, cls = '') => { const e = $('#mmCount'); if (!e) return; e.textContent = t; e.className = 'mmcount ' + cls; if (t) { void e.offsetWidth; e.classList.add('in'); } };
const mmMsg = (t, cls = '') => { const e = $('#mmMsg'); if (e) { e.textContent = t; e.className = 'mmmsg ' + cls; } };
function net_mimic(m) {
  if (!S || S.game !== 'mimic' || m.k !== 'takes') return;
  m.list.forEach(t => { MM.takes[m.round + ':' + t.id] = t; });
}
async function mmPlayTake(round, id, fart) {
  if (fart) { mmFart(); return; }
  const t = MM.takes[round + ':' + id]; if (!t || !t.a) return;
  try {
    if (!t.buf) { const bin = Uint8Array.from(atob(t.a), c => c.charCodeAt(0)); t.buf = await mmAC().decodeAudioData(bin.buffer); }
    mmPlayBuf(t.buf, 1);
  } catch (e) { console.warn(e); }
}
// ---------- الواجهة ----------
const MMV = 1;
const mmEff = { x2: '✖️٢ دبل!', plus: '+٢٥', fart: '💨 فسوة!', none: '😐 ولا شي' };
function renderMimic(body) {
  const g = S.g, over = S.phase === 'over', snd = g.snd;
  if (body.dataset.built !== 'mimic') {
    body.dataset.built = 'mimic';
    body.innerHTML = `<div class="mmw"><div class="mmtop" id="mmTop"></div><div class="mmstage" id="mmStage"></div><div class="mmppl" id="mmPpl"></div></div>`;
    body.querySelector('.mmw').addEventListener('click', e => {
      const b = e.target.closest('[data-mm]'); if (!b) return;
      if (b.dataset.mm === 'again' && S.g.snd) mmRef(S.g.snd).then(r => mmPlayBuf(r.buf));
      if (b.dataset.mm === 'nomic') { send({ t: 'mtake', a: '', s: 0 }); MM.recFor = S.g.round + ':' + S.g.snd.id; }
    });
  }
  mmAC().resume && mmAC().resume().catch(() => {});
  MM.round = g.round;
  $('#mmTop').innerHTML = over ? '<b>النتيجة</b>' : `<span>الجولة <b>${g.round}</b> من ${g.rounds}</span>${snd ? `<b class="mmname nt">🔊 ${esc(snd.name)}</b>` : ''}<span class="cd2"></span>`;
  const st = $('#mmStage'), sig = [g.round, g.sub, over].join('|');
  if (st.dataset.sig !== sig) {
    st.dataset.sig = sig;
    if (over) st.innerHTML = '';
    else if (g.sub === 'listen') {
      st.innerHTML = `<div class="mmlisten"><div class="mmspk"><i></i><i></i><i></i><b>🔊</b></div><h3>اسمع زين…</h3><p>بعدها بتقلّده بصوتك</p><button type="button" class="btn sm" data-mm="again">🔁 اسمع مرة ثانية</button></div>`;
      if (MM.played !== g.round + ':' + snd.id) { MM.played = g.round + ':' + snd.id; mmRef(snd).then(r => setTimeout(() => mmPlayBuf(r.buf), 500)).catch(() => {}); mmMic().catch(() => {}); }
    } else if (g.sub === 'rec') {
      st.innerHTML = `<div class="mmrec"><div class="mmcount" id="mmCount"></div><canvas id="mmMeter" width="320" height="90"></canvas><p class="mmmsg" id="mmMsg"></p>${S.spec ? '' : '<button type="button" class="btn sm mmnomic" data-mm="nomic">ما عندي مايك</button>'}</div>`;
      if (!S.spec && g.mine == null) mmRecord(snd, g.round);
      else mmMsg(S.spec ? 'اللاعبين يقلّدون…' : 'سلّمت ✔ ننتظر الباقين…');
    } else if (g.sub === 'wheel' && g.wheel) {
      const effs = ['x2', 'plus', 'fart', 'none', 'x2', 'plus', 'fart', 'none'], idx = effs.indexOf(g.wheel.eff) + 4 * (g.wheel.spin % 2);
      st.innerHTML = `<div class="mmwheel"><div class="mmwh" style="--to:${360 * 5 + (360 - idx * 45 - 22.5)}deg">${effs.map((e, i) => `<i style="--k:${i}"><b>${mmEff[e].split(' ')[0]}</b></i>`).join('')}</div><span class="mmptr">▼</span><p class="mmwres" id="mmWres"></p></div>`;
      try { sfx('whoosh'); } catch {}
      setTimeout(() => { const r = $('#mmWres'); if (!r || !S.g.wheel) return; const p = S.players.find(x => x.id === S.g.wheel.id); r.innerHTML = g.wheel.id ? `${p ? bmFace(p.id) + ' ' + esc(p.name) : '؟'}: <b>${mmEff[g.wheel.eff]}</b>` : 'محد قلّد 😶'; r.classList.add('in'); try { sfx(g.wheel.eff === 'fart' ? 'boing' : g.wheel.eff === 'none' ? 'nope' : 'ding'); } catch {} }, 3300);
    } else if (g.sub === 'play' || g.sub === 'score') {
      st.innerHTML = `<div class="mmplay" id="mmPlay"></div>`;
      if (!Object.keys(MM.takes).some(k => k.startsWith(g.round + ':'))) send({ t: 'mget' });
    }
  }
  // تشغيل التسجيلات بالدور
  if (g.sub === 'play' || g.sub === 'score') {
    const pl = $('#mmPlay');
    if (pl) pl.innerHTML = g.order.map((id, i) => { const t = g.tk && g.tk[id], cur = g.sub === 'play' && i === g.pi, fart = g.wheel && g.wheel.id === id && g.wheel.eff === 'fart'; return `<div class="mmtake${cur ? ' cur' : ''}${t ? ' shown' : ''}"><span class="bmav">${bmFace(id)}</span><b class="nt">${esc((S.players.find(p => p.id === id) || {}).name || '؟')}</b>${cur ? '<span class="mmeq"><i></i><i></i><i></i><i></i></span>' : ''}${t ? `<em>${t.none ? '😶 ما قلّد' : t.s + '%'}</em>${g.wheel && g.wheel.id === id ? `<small>${mmEff[g.wheel.eff]}</small>` : ''}<i class="mmpts">+${t.p}</i>` : ''}</div>`; }).join('');
    if (g.sub === 'play' && MM.pi !== g.round * 100 + g.pi) {
      MM.pi = g.round * 100 + g.pi; const id = g.order[g.pi], fart = g.wheel && g.wheel.id === id && g.wheel.eff === 'fart';
      setTimeout(() => mmPlayTake(g.round, id, fart), 350);
    }
  }
  const list = [...S.players].sort((a, b) => (g.scores[b.id] || 0) - (g.scores[a.id] || 0));
  $('#mmPpl').innerHTML = list.map(p => `<div class="mmp${g.sub === 'rec' && g.done.includes(p.id) ? ' done' : ''}${p.id === S.me ? ' me' : ''}"><span class="bmav">${bmFace(p.id)}</span><b class="nt">${esc(p.name)}</b><i>${g.scores[p.id] || 0}</i>${g.got && g.got[p.id] != null ? `<em>+${g.got[p.id]}</em>` : ''}</div>`).join('');
  if (g.sub !== MM.sub) { if (g.sub === 'score') sfx('card'); MM.sub = g.sub; }
}
