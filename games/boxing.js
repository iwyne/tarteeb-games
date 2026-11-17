// حلبة ترتيب (ملاكمة): نزال ١ ضد ١ والباقين يتفرجون ويشجعون. الفايز يبقى بالحلبة ويجيه المتحدي اللي بعده.
// الضربات: جاب سريع، خطاف قوي، أبركت (يحتاج طاقة). دفاع يخفف الضربة، ومراوغة تفوّت الضربة وتفتح خصمك.
// الضرب أثناء تحضير خصمك لضربته = كاونتر (ضرر أكثر ويلغي ضربته). أول واحد يوصل عدد الانتصارات يفوز.
const SCALE = +process.env.BOX_SCALE || 1;
const TICK = 50, ROUND_MS = 75000 * SCALE, INTRO_MS = 3200 * SCALE, KO_MS = 3500 * SCALE;
const MOVES = {
  jab: { wind: 170, rec: 160, dmg: 6, st: 7 },
  hook: { wind: 430, rec: 330, dmg: 14, st: 18 },
  upper: { wind: 600, rec: 450, dmg: 24, st: 35, stun: 700 }
};
const DODGE_MS = 380, DODGE_CD = 900, DODGE_ST = 9, REGEN = 22; // طاقة بالثانية
module.exports = H => {
  const name = (r, id) => { const p = r.players.find(q => q.id === id); return p ? p.name : '؟'; };
  const isBot = (r, id) => { const p = r.players.find(q => q.id === id); return !!(p && p.bot); };
  const fighter = id => ({ id, hp: 100, st: 100, a: 'idle', until: 0, kind: null, dodgeAt: -1e9, side: 0, hits: 0, combo: 0, comboAt: 0, ai: { next: 0 } });
  function newMatch(r) {
    const g = r.g; if (r.phase !== 'play') return;
    if (!g.champ) g.champ = g.queue.shift();
    const ch = g.queue.shift();
    if (ch == null) return finish(r);
    g.f = [fighter(g.champ), fighter(ch)]; g.matchN++;
    g.sub = 'intro'; g.koBy = null; g.res = null; g.ev = [];
    H.log(r, `🥊 النزال ${g.matchN}: ${name(r, g.champ)} ضد ${name(r, ch)}`);
    H.setTimer(r, INTRO_MS, () => { g.sub = 'fight'; g.endAt = Date.now() + ROUND_MS; H.setTimer(r, ROUND_MS, () => endMatch(r, null)); });
  }
  function endMatch(r, koWinner) {
    const g = r.g; if (g.sub !== 'fight') return;
    const [a, b] = g.f;
    let w = koWinner; if (w == null) w = a.hp === b.hp ? (a.hits >= b.hits ? a : b) : a.hp > b.hp ? a : b;
    const l = w === a ? b : a;
    g.sub = 'ko'; g.res = { w: w.id, l: l.id, ko: koWinner != null }; g.wins[w.id] = (g.wins[w.id] || 0) + 1;
    H.log(r, koWinner ? `💥 ضربة قاضية! ${name(r, w.id)} طيّح ${name(r, l.id)}` : `⏱ انتهى الوقت — ${name(r, w.id)} فاز بالنقاط`);
    H.cast(r, { t: 'gnet', g: 'boxing', k: 'end', w: w.id, ko: !!koWinner });
    g.champ = w.id; g.queue.push(l.id);
    H.setTimer(r, KO_MS, () => { if (g.wins[w.id] >= g.target) finish(r); else newMatch(r); });
    H.push(r);
  }
  function finish(r) {
    const g = r.g; clearInterval(g.iv);
    const L = Object.entries(g.wins).sort((a, b) => b[1] - a[1]), top = L.length ? L[0][1] : 0;
    const ws = r.players.filter(p => (g.wins[p.id] || 0) === top && top > 0);
    r.phase = 'over'; r.winner = ws.map(p => p.name).join(' و ') || '—'; H.win(r, ws);
    H.log(r, `🏆 ${r.winner} بطل الحلبة!`); H.setTimer(r, 0, null);
  }
  // يبدأ حركة (لو يقدر)
  function act(r, F, k, d) {
    const g = r.g, now = Date.now(); if (g.sub !== 'fight') return false;
    if (F.a === 'ko' || F.a === 'stun' || now < F.until && F.a !== 'block') return false;
    if (k === 'block') { if (F.a === 'idle') { F.a = 'block'; F.until = 0; } return true; }
    if (k === 'unblock') { if (F.a === 'block') F.a = 'idle'; return true; }
    if (k === 'dodge') {
      if (now - F.dodgeAt < DODGE_CD || F.st < DODGE_ST) return false;
      F.st -= DODGE_ST; F.a = 'dodge'; F.side = d > 0 ? 1 : -1; F.until = now + DODGE_MS; F.dodgeAt = now; return true;
    }
    const M = MOVES[k]; if (!M) return false;
    if (F.st < M.st) { F.tired = now; return false; }
    F.st -= M.st; F.a = 'wind'; F.kind = k; F.until = now + M.wind;
    return true;
  }
  function resolve(r, F, O, now) {
    const g = r.g, M = MOVES[F.kind]; let dmg = M.dmg, tag = F.kind;
    F.a = 'rec'; F.until = now + M.rec;
    if (O.a === 'dodge') { F.until += 380; g.ev.push({ k: 'miss', by: F.id, to: O.id, n: ++g.evN }); return; }
    const counter = O.a === 'wind';
    if (O.a === 'block') { dmg = Math.round(dmg * (F.kind === 'upper' ? .45 : .2)); O.st = Math.max(0, O.st - 4); if (F.kind === 'hook') F.until += 150; tag = 'block'; }
    if (counter) { dmg = Math.round(dmg * 1.5); O.a = 'stun'; O.until = now + 380; tag = 'counter'; }
    if (F.kind === 'upper' && O.a !== 'block') { O.a = 'stun'; O.until = now + M.stun; }
    F.combo = now - F.comboAt < 1200 ? F.combo + 1 : 1; F.comboAt = now;
    O.hp = Math.max(0, O.hp - dmg); F.hits++;
    g.ev.push({ k: 'hit', by: F.id, to: O.id, dmg, kind: F.kind, tag, combo: F.combo, n: ++g.evN });
    if (O.hp <= 0) { O.a = 'ko'; O.until = Infinity; F.a = 'idle'; endMatch(r, F); }
  }
  // ---- البوت ----
  function bot(r, F, O, now) {
    const ai = F.ai; if (now < ai.next) return;
    const lvl = r.g.diff;
    const react = lvl === 'hard' ? 160 : 260;
    ai.next = now + react + Math.random() * 180;
    if (F.a === 'block' && !(O.a === 'wind')) act(r, F, 'unblock');
    // دفاع أو مراوغة لو الخصم يحضّر ضربة قوية
    if (O.a === 'wind' && O.kind !== 'jab' && Math.random() < (lvl === 'hard' ? .65 : .45)) {
      if (Math.random() < .5 && now - F.dodgeAt > DODGE_CD) act(r, F, 'dodge', Math.random() < .5 ? -1 : 1); else act(r, F, 'block');
      return;
    }
    if (O.a === 'wind' && Math.random() < .12) { act(r, F, 'jab'); return; } // يحاول كاونتر
    if (F.a !== 'idle') return;
    const open = O.a === 'rec' || O.a === 'stun';
    const p = Math.random();
    if (F.st >= 60 && open && p < .5) act(r, F, 'upper');
    else if (open || p < .35) act(r, F, p < .55 ? 'jab' : 'hook');
    else if (p < .55) act(r, F, 'jab');
    else if (p < .62) act(r, F, 'block');
  }
  function tick(r) {
    const g = r.g, now = Date.now();
    if (g.sub === 'fight') {
      const [a, b] = g.f;
      for (const [F, O] of [[a, b], [b, a]]) {
        if (g.sub !== 'fight') break;
        if (F.a === 'wind' && now >= F.until) resolve(r, F, O, now);
        else if ((F.a === 'rec' || F.a === 'dodge' || F.a === 'stun') && now >= F.until) { F.a = 'idle'; F.side = 0; }
        if (F.a === 'idle' || F.a === 'block') F.st = Math.min(100, F.st + REGEN * TICK / 1000 * (F.a === 'block' ? .35 : 1));
        if (g.sub === 'fight' && isBot(r, F.id)) bot(r, F, O, now);
      }
    }
    if (g.f) {
      const s = { k: 'st', sub: g.sub, f: g.f.map(F => [F.id, F.hp, Math.round(F.st), F.a, F.kind, F.side, Math.max(0, F.until - now) | 0]), ev: g.ev.splice(0) };
      const js = JSON.stringify([s.sub, s.f.map(x => x.slice(0, 6))]);
      if (js !== g._last || s.ev.length) { g._last = js; H.cast(r, { t: 'gnet', g: 'boxing', ...s }); }
    }
  }
  return {
    min: 2, max: 8,
    start(r) {
      const target = [1, 2, 3].includes(+r.opts.bwins) ? +r.opts.bwins : 2;
      const ids = H.shuffle(r.players.map(p => p.id));
      r.g = { queue: ids, champ: null, f: null, wins: {}, matchN: 0, target, sub: 'intro', ev: [], evN: 0, res: null, diff: 'mid', endAt: 0 };
      r.winner = null; r.phase = 'play';
      H.log(r, `🔔 فتحت الحلبة! أول واحد يوصل ${target} ${target === 1 ? 'فوز' : 'انتصارات'} هو البطل`);
      clearInterval(r.g.iv);
      const g = r.g;
      g.iv = setInterval(() => { if (r.g !== g || r.phase !== 'play' || !H.alive(r)) return clearInterval(g.iv); try { tick(r); } catch (e) { console.error('box tick', e); } }, TICK);
      newMatch(r);
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play' || m.t !== 'bx' || !g.f) return 'quiet';
      const F = g.f.find(x => x.id === p.id); if (!F || !H.rate(p, 'bx', 60)) return 'quiet';
      act(r, F, String(m.a), +m.d || 1);
      return 'quiet';
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      return { sub: g.sub, f: g.f ? g.f.map(F => ({ id: F.id, hp: F.hp, st: Math.round(F.st) })) : null, queue: g.queue, champ: g.champ, wins: g.wins, target: g.target, matchN: g.matchN, res: g.res, left: g.sub === 'fight' ? Math.max(0, g.endAt - Date.now()) : 0 };
    },
    leave(r, p) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      g.queue = g.queue.filter(id => id !== p.id);
      if (g.f && g.f.some(F => F.id === p.id) && g.sub !== 'ko') {
        const o = g.f.find(F => F.id !== p.id);
        if (g.sub === 'fight') { g.f.find(F => F.id === p.id).hp = 0; endMatch(r, o); }
        else { g.champ = o.id; newMatch(r); }
      } else if (g.champ === p.id) g.champ = null;
      if (r.players.filter(q => q.id !== p.id).length < 2) finish(r);
    }
  };
};
