// المافيا: مدينة فيها مافيا متخفين. بالليل المافيا تختار ضحية، والطبيب يحمي، والمحقق يكشف، والقناص عنده طلقة وحدة.
// بالنهار المدينة تتناقش (بصوت الديسكورد أو بالشات هنا) وتصوّت على شخص تطرده. السيرفر هو الراوي.
// المدينة تفوز لو طلّعت كل المافيا. المافيا تفوز لو صار عددهم = الباقين. المهرج يفوز لو المدينة صوّتت عليه.
const ROLES = {
  mafia: { n: 'مافيا', team: 'm' }, god: { n: 'الأب الروحي', team: 'm' },
  doc: { n: 'الطبيب', team: 't' }, det: { n: 'المحقق', team: 't' }, sniper: { n: 'القناص', team: 't' }, mayor: { n: 'العمدة', team: 't' },
  jester: { n: 'المهرج', team: 'j' }, cit: { n: 'مواطن', team: 't' }
};
// أقل عدد لاعبين عشان يدخل الدور
const NEED = { doc: 4, det: 5, sniper: 7, god: 7, jester: 7, mayor: 8 };
const SC = +process.env.MAFIA_SCALE || 1; // للاختبار بس
const INTRO = 9000 * SC, DAWN = 8000 * SC, VERDICT = 8000 * SC, VOTE = 35000 * SC, NIGHT_MIN = 18000 * SC;
const rnd = n => Math.random() * n | 0;
const pick = a => a[rnd(a.length)];
const autoMafia = n => n <= 6 ? 1 : n <= 9 ? 2 : n <= 12 ? 3 : 4;
const BOT_DAY = ['أنا أشك في {x}… ساكت زيادة', 'والله إني بريء', 'مين قتل {d}؟ شي غريب', '{x} كلامه مو راكب', 'خلونا نصوّت صح هالمرة', 'أنا مواطن عادي يا جماعة', 'لا تستعجلون بالتصويت', 'أحس المافيا بيننا وقاعدين يضحكون', '{x} دافع عن نفسك'];
const BOT_MAFIA = ['نقتل {x}؟', 'خلونا على {x}', 'لا تخلون الطبيب يعرف', 'تمام 👍'];

module.exports = H => {
  const byId = (r, id) => r.players.find(p => p.id === id);
  const plist = g => Object.values(g.P);
  const alive = g => plist(g).filter(P => P.alive);
  const nm = (r, id) => (byId(r, id) || {}).name || (r.g && r.g.P[id] && r.g.P[id].name) || '؟';
  const isM = P => ROLES[P.role].team === 'm';
  const say = (r, ch, from, text) => { const g = r.g; g.chat.push({ ch, from, text: String(text).slice(0, 200), t: Date.now() }); if (g.chat.length > 120) g.chat.shift(); };
  const sys = (r, text) => say(r, 'sys', null, text);

  function finish(r, side, why, jid) {
    const g = r.g; if (r.phase !== 'play') return;
    g.win = side; g.why = why; g.sub = 'end'; g.jWin = jid || null;
    r.phase = 'over';
    r.winner = side === 't' ? 'المدينة' : side === 'm' ? 'المافيا' : 'المهرج';
    H.win(r, r.players.filter(q => g.P[q.id] && (side === 'j' ? q.id === jid : ROLES[g.P[q.id].role].team === side)));
    H.log(r, why); H.setTimer(r, 0, null); clearBots(g);
  }
  function checkWin(r) {
    const g = r.g; if (r.phase !== 'play') return true;
    const al = alive(g), m = al.filter(isM).length, o = al.length - m;
    if (!m) { finish(r, 't', 'المدينة طلّعت كل المافيا!'); return true; }
    if (m >= o) { finish(r, 'm', 'المافيا سيطروا على المدينة'); return true; }
    return false;
  }
  // البوتات: نجدول قراراتهم بأوقات عشوائية
  function clearBots(g) { (g.bt || []).forEach(clearTimeout); g.bt = []; }
  function later(r, ms, fn) { const g = r.g; const t = setTimeout(() => { if (!H.alive(r) || r.g !== g || r.phase !== 'play') return; fn(); H.push(r); }, ms); g.bt.push(t); }
  const bots = r => alive(r.g).filter(P => P.bot);

  // ---- الليل ----
  function night(r) {
    const g = r.g; clearBots(g);
    g.sub = 'night'; g.night++; g.nightAt = Date.now(); g.act = { m: {}, doc: null, det: null, snip: null, snipDone: false };
    sys(r, `🌙 الليلة ${g.night}: المدينة نامت…`);
    H.setTimer(r, g.nightMs, () => dawn(r));
    // البوتات
    bots(r).forEach(P => {
      const others = alive(g).filter(Q => Q.id !== P.id);
      if (isM(P)) later(r, 3000 + rnd(9000), () => {
        if (g.sub !== 'night') return;
        const pre = Object.values(g.act.m)[0], tgts = others.filter(Q => !isM(Q));
        const kn = tgts.find(Q => Q.revealed) || tgts.find(Q => g.claims[Q.id] === 'det');
        const t = pre && Math.random() < .7 ? pre : (kn || pick(tgts) || {}).id;
        if (t) { nightAct(r, P, { t: 'kill', id: t }); if (Math.random() < .5) say(r, 'm', P.id, pick(BOT_MAFIA).replace('{x}', nm(r, t))); }
      });
      else if (P.role === 'doc') later(r, 3000 + rnd(9000), () => { const c = alive(g).filter(Q => Q.id !== g.lastSave); const q = Math.random() < .3 && g.lastSave !== P.id ? P : (c.find(Q => Q.revealed) || pick(c)); if (q) nightAct(r, P, { t: 'save', id: q.id }); });
      else if (P.role === 'det') later(r, 3000 + rnd(9000), () => { const c = others.filter(Q => P.checks[Q.id] == null); if (c.length) nightAct(r, P, { t: 'check', id: pick(c).id }); });
      else if (P.role === 'sniper') later(r, 3000 + rnd(9000), () => {
        const sus = others.find(Q => g.claims[Q.id] === 'mafia');
        if (!P.used && sus && Math.random() < .6) nightAct(r, P, { t: 'snipe', id: sus.id }); else nightAct(r, P, { t: 'snipe', id: null });
      });
    });
  }
  function nightNeeds(g) {
    const al = alive(g), a = g.act;
    if (al.some(P => isM(P) && !a.m[P.id])) return false;
    if (al.some(P => P.role === 'doc') && !a.doc) return false;
    if (al.some(P => P.role === 'det') && !a.det) return false;
    if (al.some(P => P.role === 'sniper' && !P.used) && !a.snipDone) return false;
    return true;
  }
  function nightAct(r, P, m) {
    const g = r.g; if (g.sub !== 'night' || !P || !P.alive) return;
    const T = m.id ? g.P[m.id] : null; if (m.id && (!T || !T.alive)) return;
    if (m.t === 'kill' && isM(P) && T && !isM(T)) g.act.m[P.id] = T.id;
    else if (m.t === 'save' && P.role === 'doc' && T && !(T.id === g.lastSave)) g.act.doc = T.id;
    else if (m.t === 'check' && P.role === 'det' && T && T.id !== P.id && !g.act.det) g.act.det = T.id;
    else if (m.t === 'snipe' && P.role === 'sniper' && !P.used && !g.act.snipDone) { g.act.snip = T && T.id !== P.id ? T.id : null; g.act.snipDone = true; }
    else return;
    // نخلص الليل بدري لو الكل قرّر (بس بعد حد أدنى عشان ما ينكشف مين بوت)
    if (nightNeeds(g)) { const left = r.deadline - Date.now(), min = g.nightAt + NIGHT_MIN - Date.now(); if (left > Math.max(min, 2500)) H.setTimer(r, Math.max(min, 2500), () => dawn(r)); }
  }
  // ---- الفجر: النتائج ----
  function dawn(r) {
    const g = r.g; if (g.sub !== 'night') return; clearBots(g);
    const a = g.act, cnt = {};
    Object.values(a.m).forEach(t => { cnt[t] = (cnt[t] || 0) + 1; });
    const top = Math.max(0, ...Object.values(cnt)), lead = Object.keys(cnt).filter(k => cnt[k] === top);
    const god = alive(g).find(P => P.role === 'god');
    let victim = lead.length === 1 ? lead[0] : lead.length ? (god && lead.includes(a.m[god.id]) ? a.m[god.id] : pick(lead)) : null;
    const dead = [], saved = [];
    const hit = (id, how) => { if (!id) return; const T = g.P[id]; if (!T || !T.alive) return; if (a.doc === id) { saved.push(how); return; } T.alive = false; T.died = { day: g.night, how }; dead.push({ id, how }); };
    hit(victim, 'mafia');
    if (a.snipDone && a.snip) { const S = alive(g).find(P => P.role === 'sniper'); if (S) S.used = true; hit(a.snip, 'sniper'); }
    else if (a.snipDone) { /* ما أطلق */ }
    if (a.det) { const D = plist(g).find(P => P.role === 'det'); const T = g.P[a.det]; if (D && T) D.checks[a.det] = isM(T) && T.role !== 'god'; }
    g.lastSave = a.doc;
    g.dawn = { dead, saved: saved.length > 0 };
    g.sub = 'dawn';
    if (!dead.length) sys(r, saved.length ? '☀️ صباح الخير… الطبيب أنقذ أحد الليلة!' : '☀️ صباح الخير… ما مات أحد الليلة');
    else dead.forEach(d => sys(r, `☀️ لقوا ${nm(r, d.id)} ${d.how === 'sniper' ? 'مقتول برصاصة قنّاص' : 'مقتول'}${g.reveal ? ' — كان ' + ROLES[g.P[d.id].role].n : ''}`));
    if (checkWin(r)) return;
    H.setTimer(r, DAWN, () => day(r));
  }
  // ---- النهار ----
  function day(r) {
    const g = r.g; clearBots(g);
    g.sub = 'day'; g.day++; g.ready = {};
    H.setTimer(r, g.dayMs, () => vote(r));
    // المحقق البوت يكشف اللي لقاه
    bots(r).forEach(P => {
      if (P.role === 'det') { const f = Object.keys(P.checks).find(id => P.checks[id] && g.P[id].alive); if (f) later(r, 4000 + rnd(6000), () => { say(r, 'd', P.id, `أنا المحقق، ${nm(r, f)} مافيا!`); g.claims[f] = 'mafia'; g.claims[P.id] = 'det'; }); }
      const n = rnd(3);
      for (let i = 0; i < n; i++) later(r, 3000 + rnd(Math.max(4000, g.dayMs - 8000)), () => {
        const others = alive(g).filter(Q => Q.id !== P.id), last = g.dawn && g.dawn.dead[0];
        say(r, 'd', P.id, pick(BOT_DAY).replace('{x}', (pick(others) || {}).name || '؟').replace('{d}', last ? nm(r, last.id) : 'فلان'));
      });
      later(r, 6000 + rnd(Math.max(4000, g.dayMs - 10000)), () => ready(r, P));
    });
  }
  function ready(r, P) {
    const g = r.g; if (g.sub !== 'day' || !P.alive) return;
    g.ready[P.id] = 1;
    const al = alive(g); if (al.filter(Q => g.ready[Q.id]).length > al.length / 2) vote(r);
  }
  function vote(r) {
    const g = r.g; if (g.sub !== 'day') return; clearBots(g);
    g.sub = 'vote'; g.votes = {};
    sys(r, '🗳️ وقت التصويت: مين تطردون من المدينة؟');
    H.setTimer(r, VOTE, () => verdict(r));
    bots(r).forEach(P => later(r, 3000 + rnd(14000), () => {
      if (g.sub !== 'vote' || g.votes[P.id]) return;
      const others = alive(g).filter(Q => Q.id !== P.id);
      let t = null;
      if (P.role === 'det') { const f = Object.keys(P.checks).find(id => P.checks[id] && g.P[id].alive); if (f) t = f; }
      if (!t && !isM(P)) { const c = others.find(Q => g.claims[Q.id] === 'mafia'); if (c) t = c.id; }
      if (!t) {
        const cnt = {}; Object.values(g.votes).forEach(v => { if (v !== 'skip') cnt[v] = (cnt[v] || 0) + 1; });
        const pool = Object.keys(cnt).filter(id => id !== P.id && !(isM(P) && isM(g.P[id])));
        t = pool.length && Math.random() < .55 ? pool.sort((a, b) => cnt[b] - cnt[a])[0] : Math.random() < .2 ? 'skip' : (pick(others.filter(Q => !(isM(P) && isM(Q)))) || {}).id || 'skip';
      }
      castVote(r, P, t);
    }));
  }
  function castVote(r, P, t) {
    const g = r.g; if (g.sub !== 'vote' || !P.alive) return;
    if (t !== 'skip' && (!g.P[t] || !g.P[t].alive || t === P.id)) return;
    g.votes[P.id] = t;
    if (alive(g).every(Q => g.votes[Q.id])) H.setTimer(r, 1500, () => verdict(r));
  }
  function verdict(r) {
    const g = r.g; if (g.sub !== 'vote') return; clearBots(g);
    const cnt = { skip: 0 };
    Object.entries(g.votes).forEach(([v, t]) => { const w = g.P[v] && g.P[v].revealed ? 2 : 1; cnt[t] = (cnt[t] || 0) + w; });
    const ids = Object.keys(cnt).filter(k => k !== 'skip'), top = Math.max(0, ...ids.map(k => cnt[k])), lead = ids.filter(k => cnt[k] === top);
    let ex = null;
    if (lead.length === 1 && top > cnt.skip) ex = lead[0];
    g.tally = cnt; g.exec = ex; g.sub = 'verdict';
    if (ex) {
      const T = g.P[ex]; T.alive = false; T.died = { day: g.day, how: 'vote' };
      sys(r, `⚖️ المدينة طردت ${nm(r, ex)} — كان ${ROLES[T.role].n}`);
      if (T.role === 'jester') return finish(r, 'j', `المهرج ${nm(r, ex)} ضحك على الكل! صوّتوا عليه وفاز`, ex);
    } else sys(r, top ? '⚖️ تعادل بالأصوات… ما انطرد أحد' : '⚖️ ما انطرد أحد اليوم');
    if (checkWin(r)) return;
    H.setTimer(r, VERDICT, () => night(r));
  }

  return {
    min: 5, max: 16, ROLES,
    start(r) {
      const o = r.opts || {}, ids = H.shuffle(r.players.map(p => p.id)), n = ids.length;
      const want = o.mroles || { doc: 1, det: 1, sniper: 1, god: 1, jester: 1, mayor: 1 };
      let mc = o.mcount ? Math.min(+o.mcount, Math.floor((n - 1) / 2)) : autoMafia(n);
      mc = Math.max(1, mc);
      const roles = [];
      if (want.god && n >= NEED.god && mc >= 2) { roles.push('god'); mc--; }
      for (let i = 0; i < mc; i++) roles.push('mafia');
      ['doc', 'det', 'sniper', 'mayor', 'jester'].forEach(k => { if (want[k] && n >= NEED[k] && roles.length < n) roles.push(k); });
      while (roles.length < n) roles.push('cit');
      const sh = H.shuffle(roles), P = {};
      ids.forEach((id, i) => { const q = byId(r, id); P[id] = { id, name: q.name, bot: !!q.bot, role: sh[i], alive: true, checks: {}, used: false, revealed: false }; });
      r.g = { P, sub: 'intro', night: 0, day: 0, chat: [], bt: [], claims: {}, act: null, dawn: null, votes: {}, tally: null, exec: null, lastSave: null, ready: {},
        dayMs: (o.dayT || 90) * 1000 * SC, nightMs: 40000 * SC, reveal: o.reveal !== false, nightAt: 0, roleList: sh.slice().sort() };
      r.winner = null; r.winTeam = null; r.phase = 'play';
      H.log(r, '🎩 المافيا بينكم…');
      H.setTimer(r, INTRO, () => night(r));
    },
    act(r, p, m) {
      const g = r.g; if (!g || r.phase !== 'play') return;
      const P = g.P[p.id];
      if (m.t === 'mchat' || m.t === 'dchat') {
        if (!P || !H.rate(p, 'mchat', 700)) return;
        const text = String(m.text || '').trim().slice(0, 200); if (!text) return;
        if (!P.alive) say(r, 'x', p.id, text);
        else if (g.sub === 'night') { if (isM(P)) say(r, 'm', p.id, text); }
        else say(r, 'd', p.id, text);
        return;
      }
      if (!P || !P.alive) return;
      if (['kill', 'save', 'check', 'snipe'].includes(m.t)) nightAct(r, P, m);
      else if (m.t === 'ready') ready(r, P);
      else if (m.t === 'tovote') { if (r.host === p.id && g.sub === 'day') vote(r); }
      else if (m.t === 'vote') castVote(r, P, m.id === 'skip' ? 'skip' : m.id);
      else if (m.t === 'reveal') { if (P.role === 'mayor' && !P.revealed && (g.sub === 'day' || g.sub === 'vote')) { P.revealed = true; sys(r, `🎖️ ${p.name} كشف نفسه: هو العمدة! صوته بصوتين`); } }
    },
    view(r, p) {
      const g = r.g; if (!g) return null;
      const P = g.P[p.id], over = r.phase === 'over', me = P || null, mine = me && isM(me);
      const seeAll = over || (me && !me.alive) || p.spec;
      const roleOf = Q => {
        if (seeAll || (me && Q.id === me.id)) return Q.role;
        if (!Q.alive && g.reveal) return Q.role;
        if (mine && isM(Q)) return Q.role;
        if (Q.revealed) return 'mayor';
        return null;
      };
      const chat = g.chat.filter(c => c.ch === 'sys' || c.ch === 'd' || (c.ch === 'm' && (mine || seeAll)) || (c.ch === 'x' && seeAll)).slice(-50)
        .map(c => ({ ch: c.ch, from: c.from, text: c.text, t: c.t }));
      const a = g.act;
      const nv = g.sub === 'night' && a ? {
        mk: mine ? a.m : null, my: me ? (isM(me) ? a.m[me.id] : me.role === 'doc' ? a.doc : me.role === 'det' ? a.det : me.role === 'sniper' ? (a.snipDone ? (a.snip || 'none') : null) : null) : null
      } : null;
      return {
        sub: g.sub, night: g.night, day: g.day, reveal: g.reveal,
        me: me ? { role: me.role, alive: me.alive, used: me.used, revealed: me.revealed, checks: me.role === 'det' || seeAll ? me.checks : null, lastSave: me.role === 'doc' ? g.lastSave : null } : null,
        P: plist(g).map(Q => ({ id: Q.id, name: Q.name, alive: Q.alive, role: roleOf(Q), died: Q.died || null, rev: Q.revealed })),
        nv, dawn: g.sub === 'dawn' || g.sub === 'day' ? g.dawn : null,
        ready: g.sub === 'day' ? Object.keys(g.ready) : null,
        voted: g.sub === 'vote' ? Object.keys(g.votes) : null, myVote: g.sub === 'vote' && me ? g.votes[me.id] || null : null,
        votes: g.sub === 'verdict' || over ? g.votes : null, tally: g.sub === 'verdict' || over ? g.tally : null, exec: g.sub === 'verdict' || over ? g.exec : null,
        chat, win: g.win || null, why: g.why || null, jWin: g.jWin, roleList: g.roleList
      };
    },
    leave(r, p) {
      const g = r.g; if (!g) return; const P = g.P[p.id]; if (!P || !P.alive) return;
      P.alive = false; P.died = { day: g.day, how: 'left' }; sys(r, `🚪 ${p.name} طلع من المدينة — كان ${ROLES[P.role].n}`);
      if (g.sub === 'vote') { delete g.votes[p.id]; Object.keys(g.votes).forEach(k => { if (g.votes[k] === p.id) delete g.votes[k]; }); }
      checkWin(r);
    }
  };
};
