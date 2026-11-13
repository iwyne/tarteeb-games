// شرح الألعاب: مشاهد متحركة لكل لعبة مع صوت (تسجيل علي) ونص تحت.
// كل جملة مشهد. الصوت من tut/<لعبة>/<رقم>.mp3، ولو ما فيه صوت المشهد يمشي بوقت حسب طول الجملة.
// العناصر: {k: نوع، x,y: المكان بالنسبة المئوية، d: متى يدخل، in: طريقة الدخول، mv: [[x,y,وقت,مدة]]، out: متى يطلع، loop: حركة متكررة، ft: [وقت، لون، قيمة] يقلب الورقة}
const tuTC = (c, v, x, y, o) => Object.assign({ k: 'card', c, v, x, y }, o);
const tuTA = (n, x, y, o) => Object.assign({ k: 'av', n, x, y }, o);
const tuTT = (v, x, y, o) => Object.assign({ k: 'txt', v, x, y }, o);
const tuTB = (v, x, y, o) => Object.assign({ k: 'bub', v, x, y }, o);
const tuTI = (v, x, y, o) => Object.assign({ k: 'ico', v, x, y }, o);
const tuTS = (v, x, y, o) => Object.assign({ k: 'stamp', v, x, y }, o);
const tuTX = (k, x, y, o) => Object.assign({ k, x, y }, o);
const tuFan = (cards, cx, cy, o = {}) => cards.map(([c, v], i) => tuTC(c, v, cx + (i - (cards.length - 1) / 2) * (o.gap || 7), cy + Math.abs(i - (cards.length - 1) / 2) * 1.2, Object.assign({ r: (i - (cards.length - 1) / 2) * 6, in: 'up', d: .1 + i * .07 }, o.e && o.e(i))));
const tuAVS = ['😎', '🤠', '🧕', '👨🏻', '👩🏽', '🧔🏽', '👱🏻‍♀️', '🧑🏾'];
const tuRing = (n, cx, cy, rx, ry, o = {}) => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2 - Math.PI / 2; return tuTA(o.names ? o.names[i] : tuAVS[i % 8], cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, Object.assign({ in: 'pop', d: .1 + i * .08 }, o.e && o.e(i))); });

const tuTTring = (n, cx, cy, rx, ry) => tuRing(n, cx, cy, rx, ry);
const TUT = {
  uno: [
    { t: 'أونو! هدفك بسيط: تخلّص كل أوراقك قبل الكل.', e: [...tuFan([['r', '7'], ['b', '2'], ['g', '⊘'], ['y', '5'], ['b', '+2']], 50, 60, { e: i => ({ out: 2.2 + i * .35 }) }), tuTI('🏆', 50, 50, { d: 4.2, in: 'pop', s: 2.2, loop: 'bob' })] },
    { t: 'على الطاولة ورقة. تنزّل فوقها ورقة بنفس اللون… أو بنفس الرقم.', e: [tuTC('r', '7', 50, 40, { in: 'drop', s: 1.2 }), tuTC('r', '3', 28, 80, { d: .6, in: 'up', r: -8, mv: [[44, 44, 1.6, .6]] }), tuTI('✅', 62, 30, { d: 2.3, in: 'pop' }), tuTC('b', '7', 72, 80, { d: 3, in: 'up', r: 8, mv: [[56, 46, 4, .6]] }), tuTI('✅', 64, 32, { d: 4.7, in: 'pop' }), tuTT('نفس اللون', 22, 30, { d: 2.3, in: 'pop', c: 'r' }), tuTT('نفس الرقم', 80, 30, { d: 4.7, in: 'pop', c: 'b' })] },
    { t: 'ما عندك ورقة تركب؟ تسحب ورقة من الكومة.', e: [tuTC('g', '4', 50, 35, { in: 'drop' }), tuTX('back', 20, 35, { in: 'left' }), tuTX('back', 21, 34, { in: 'left', d: .1 }), tuTX('back', 22, 33, { in: 'left', d: .2, mv: [[50, 78, 1.6, .7]] }), ...tuFan([['r', '1'], ['y', '9']], 50, 78, { gap: 9 }), tuTI('👆', 26, 52, { d: 1, in: 'pop', loop: 'bob' })] },
    { t: 'الأوراق الخاصة: المنع يطوّف اللي بعدك، والعكس يقلب الدور، و+٢ يسحّب اللي بعدك ورقتين.', e: [tuTC('g', '⊘', 22, 45, { in: 'pop', d: .3, s: 1.2 }), tuTT('منع', 22, 80, { d: .6, in: 'up' }), tuTC('y', '⇄', 50, 45, { in: 'pop', d: 1.8, s: 1.2, loop: 'spin', at: 2.4 }), tuTT('عكس', 50, 80, { d: 2.1, in: 'up' }), tuTC('b', '+2', 78, 45, { in: 'pop', d: 3.6, s: 1.2, loop: 'pulse', at: 4.2 }), tuTT('سحب ٢', 78, 80, { d: 3.9, in: 'up' })] },
    { t: 'والملوّنة تختار فيها أي لون، و+٤ تختار لون وتسحّب اللي بعدك أربع.', e: [tuTC('w', '★', 32, 45, { in: 'flip', s: 1.3 }), tuTC('w', '+4', 68, 45, { in: 'flip', d: 1.2, s: 1.3, loop: 'pulse', at: 2.5 }), ...['r', 'y', 'g', 'b'].map((c, i) => tuTX('dot', 26 + i * 4, 78, { c, d: .8 + i * .12, in: 'pop' }))] },
    { t: 'لما يبقى معك ورقة وحدة اضغط أونو! لا تنساه، وإلا يمسكونك وتسحب ورقتين.', e: [tuTC('y', '8', 35, 50, { in: 'up', s: 1.3 }), tuTX('btn', 66, 50, { v: 'UNO!', d: .8, in: 'pop', loop: 'pulse', at: 1.4, s: 1.4 }), tuTI('👆', 72, 64, { d: 2.2, in: 'pop', mv: [[68, 56, 2.8, .3]] })] },
    { t: 'أول واحد يخلّص أوراقه يفوز. يلا نلعب!', e: [...tuRing(4, 50, 52, 26, 30), tuTI('👑', 50, 14, { d: 1, in: 'drop', s: 1.4 }), tuTT('أونو!', 50, 52, { d: 1.6, in: 'pop', s: 1.6, c: 'r' })] }
  ],
  flip: [
    { t: 'أونو فليب: نفس أونو، بس كل ورقة لها وجهين: فاتح وغامق.', e: [tuTC('r', '7', 38, 50, { in: 'pop', s: 1.4, ft: [1.4, 'p', '7'] }), tuTC('y', '+1', 62, 50, { in: 'pop', d: .3, s: 1.4, ft: [2, 't', '+5'] }), tuTT('فاتح', 50, 16, { d: .5, in: 'down', out: 1.4 }), tuTT('غامق', 50, 16, { d: 2, in: 'down', c: 'p' })] },
    { t: 'تنزّل نفس اللون أو نفس الرقم، وأول من يخلّص أوراقه يفوز.', e: [tuTC('g', '4', 50, 38, { in: 'drop' }), tuTC('g', '9', 30, 80, { in: 'up', d: .5, mv: [[50, 40, 1.4, .6]] }), tuTC('b', '9', 70, 80, { in: 'up', d: 2.2, mv: [[51, 42, 3, .6]] }), tuTI('✅', 62, 30, { d: 3.6, in: 'pop' })] },
    { t: 'ورقة «فليب» تقلب اللعبة كلها، وكل الأوراق تنقلب للوجه الثاني!', e: [tuTC('w', 'فليب', 50, 30, { in: 'pop', s: 1.3, loop: 'pulse', at: .8 }), ...['r', 'b', 'g', 'y', 'r'].map((c, i) => tuTC(c, String(i + 2), 26 + i * 12, 74, { in: 'up', d: .2 + i * .08, ft: [1.8 + i * .12, ['p', 't', 'o', 'v', 'p'][i], String(i + 2)] }))] },
    { t: 'بالوجه الفاتح فيه +١ و+٢، وبالغامق الأقوى: +٥، و«منع الكل» تخليك تلعب مرة ثانية.', e: [tuTC('r', '+1', 20, 45, { in: 'pop' }), tuTC('b', '+2', 36, 45, { in: 'pop', d: .4 }), tuTC('p', '+5', 62, 45, { in: 'pop', d: 2, s: 1.25, loop: 'shake', at: 2.6 }), tuTC('t', '⊘⊘', 82, 45, { in: 'pop', d: 3.2, s: 1.25 }), tuTT('منع الكل', 82, 80, { d: 3.6, in: 'up', c: 't' })] },
    { t: 'و«الملوّن سحب لون»: اللي بعدك يسحب ويسحب، لين يطلع له اللون اللي اخترته!', e: [tuTC('k', '🌈', 22, 45, { in: 'flip', s: 1.3 }), ...[0, 1, 2, 3, 4, 5].map(i => tuTX('back', 50, 25, { d: .8 + i * .3, in: 'fade', mv: [[44 + i * 7, 70, .9 + i * .3, .4]] })), tuTC('o', '3', 86, 70, { d: 3, in: 'flip' }), tuTI('😩', 66, 40, { d: 2.2, in: 'pop' })] },
    { t: '+٢ وسحب اللون ما تنلعب إلا لو ما عندك لون الطاولة… واللي بعدك يقدر يتحدّاك.', e: [tuTC('b', '5', 30, 45, { in: 'drop' }), tuTC('w', '+2', 50, 45, { in: 'up', d: .6 }), tuTS('تحدّي!', 72, 40, { d: 2.4 }), tuTI('🧐', 80, 70, { d: 1.8, in: 'pop' })] },
    { t: 'ولا تنسى: لما تبقى لك ورقة وحدة اضغط أونو!', e: [tuTC('t', '6', 36, 50, { in: 'up', s: 1.3 }), tuTX('btn', 66, 50, { v: 'UNO!', d: .6, in: 'pop', loop: 'pulse', at: 1.2, s: 1.4 })] }
  ],
  codes: [
    { t: 'كلمة السر: فريقين، الأحمر والأزرق، وعلى الطاولة كلمات.', e: ['قمر', 'بحر', 'جمل', 'نار', 'باب', 'ذهب', 'شمس', 'قلم', 'سيف', 'تمر', 'برج', 'ثلج'].map((w, i) => tuTX('tile', 20 + (i % 4) * 20, 22 + (i / 4 | 0) * 26, { v: w, d: .1 + i * .06, in: 'flip' })).concat([tuTI('🔴', 6, 50, { d: 1, in: 'pop' }), tuTI('🔵', 94, 50, { d: 1.2, in: 'pop' })]) },
    { t: 'كل فريق له قائد يشوف الألوان السرية: كلمات فريقه، وكلمات الخصم، والكلمة القاتلة.', e: ['قمر', 'بحر', 'جمل', 'نار', 'باب', 'ذهب', 'شمس', 'قلم', 'سيف', 'تمر', 'برج', 'ثلج'].map((w, i) => tuTX('tile', 20 + (i % 4) * 20, 22 + (i / 4 | 0) * 26, { v: w, in: 'fade', ft: [1 + i * .08, 'rbnrbnrrknbb'[i]] })).concat([tuTI('🕵️', 50, 92, { d: .4, in: 'up', s: 1.4 })]) },
    { t: 'القائد يعطي تلميح: كلمة وحدة ورقم. الرقم يعني كم كلمة لها علاقة بالتلميح.', e: [tuTI('🕵️', 22, 55, { in: 'pop', s: 1.8 }), tuTB('سما ٢', 50, 35, { d: .8, s: 1.4 }), tuTX('tile', 70, 60, { v: 'قمر', d: 2.6, in: 'flip', loop: 'pulse', at: 3.2 }), tuTX('tile', 88, 60, { v: 'شمس', d: 3, in: 'flip', loop: 'pulse', at: 3.6 })] },
    { t: 'فريقه يخمّن ويضغط على الكلمات. لو طلعت لونهم يكملون، ولو غلطوا ينتهي دورهم.', e: [tuTX('tile', 30, 45, { v: 'قمر', in: 'fade', ft: [1, 'r'] }), tuTI('✅', 30, 20, { d: 1.4, in: 'pop' }), tuTX('tile', 50, 45, { v: 'شمس', in: 'fade', ft: [2.2, 'r'] }), tuTI('✅', 50, 20, { d: 2.6, in: 'pop' }), tuTX('tile', 70, 45, { v: 'بحر', in: 'fade', ft: [3.6, 'b'] }), tuTI('❌', 70, 20, { d: 4, in: 'pop' })] },
    { t: 'وانتبهوا من الكلمة القاتلة! اللي يضغطها يخسر فريقه على طول.', e: [tuTX('tile', 50, 45, { v: 'سيف', in: 'pop', s: 1.6, ft: [1, 'k'], loop: 'shake', at: 1.4 }), tuTI('💀', 50, 45, { d: 1.6, in: 'pop', s: 1.8 })] },
    { t: 'أول فريق يكشف كل كلماته يفوز.', e: [...[0, 1, 2, 3].map(i => tuTX('tile', 26 + i * 16, 45, { v: '', c: 'r', in: 'flip', d: .2 + i * .15 })), tuTI('🏆', 50, 20, { d: 1.2, in: 'drop', s: 1.6 }), tuTT('الأحمر فاز!', 50, 80, { d: 1.6, in: 'pop', c: 'r', s: 1.3 })] }
  ],
  hive: [
    { t: 'خلية الحروف: لوحة خلايا، كل خلية فيها حرف، وفريقين: أحمر وأزرق.', e: 'أبتثجحخدذرزسشصض'.split('').map((h, i) => tuTX('hex', 26 + (i % 5) * 12 + ((i / 5 | 0) % 2) * 6, 22 + (i / 5 | 0) * 20, { v: h, d: .05 * i, in: 'pop' })).concat([tuTI('🔴', 8, 30, { d: 1, in: 'pop' }), tuTI('🔵', 92, 30, { d: 1.2, in: 'pop' })]) },
    { t: 'تختار خلية، ويجيك سؤال جوابه يبدأ بحرفها. جاوب صح وتصير لفريقك، وتكمّل أنت.', e: [tuTX('hex', 26, 50, { v: 'ب', in: 'pop', s: 1.8, ft: [3.6, 'r'] }), tuTB('عاصمة لبنان؟', 64, 30, { d: .8 }), tuTB('بيروت!', 64, 66, { d: 2.2, c: 'r' }), tuTI('✅', 84, 66, { d: 3.2, in: 'pop' })] },
    { t: 'لو غلطت، الفريق الثاني يقدر يسرقها. ولو ما أحد جاوب، الخلية تنحرق.', e: [tuTX('hex', 34, 45, { v: 'ج', in: 'pop', s: 1.6, ft: [1.8, 'b'] }), tuTI('🦹', 34, 78, { d: 1.2, in: 'up' }), tuTX('hex', 66, 45, { v: 'ص', in: 'pop', s: 1.6, d: .4, ft: [3.2, 'x'] }), tuTI('🔥', 66, 45, { d: 3.4, in: 'pop', s: 1.6, loop: 'pulse', at: 3.8 })] },
    { t: 'الأحمر يبي يوصّل من فوق لتحت، والأزرق من اليمين لليسار.', e: [...[0, 1, 2, 3].map(i => tuTX('hex', 50 + (i % 2) * 5, 14 + i * 22, { v: '', c: 'r', in: 'pop', d: .2 + i * .2, out: 2.3 })), tuTX('arrow', 64, 50, { v: '↓', c: 'r', d: 1, in: 'fade', s: 1.6, out: 2.3 }), ...[0, 1, 2, 3, 4].map(i => tuTX('hex', 82 - i * 16, 50, { v: '', c: 'b', in: 'pop', d: 2.4 + i * .2 })), tuTX('arrow', 50, 74, { v: '←', c: 'b', d: 3.4, in: 'fade', s: 1.6 })] },
    { t: 'أول فريق يوصّل يفوز. وإذا ما أحد وصّل، يفوز اللي جاوب أكثر.', e: [...[0, 1, 2, 3].map(i => tuTX('hex', 50 + (i % 2) * 5, 14 + i * 22, { v: '', c: 'r', in: 'fade', loop: 'pulse', at: .4 + i * .1 })), tuTI('🏆', 78, 40, { d: 1, in: 'drop', s: 1.8 })] }
  ],
  liars: [
    { t: 'الكذابين الترتيب: كل جولة فيه ورقة مطلوبة… ملك، أو ملكة، أو آص.', e: [tuTC('pc', 'K', 30, 50, { in: 'drop', s: 1.3 }), tuTC('pc', 'Q', 50, 50, { in: 'drop', d: .2, s: 1.3, loop: 'pulse', at: 2.2 }), tuTC('pc', 'A', 70, 50, { in: 'drop', d: .4, s: 1.3 }), tuTT('المطلوب: ملكة', 50, 16, { d: 2, in: 'pop', c: 'r' })] },
    { t: 'بدورك تنزّل من ورقة لثلاث أوراق مقلوبة، وتقول إنها كلها الورقة المطلوبة.', e: [tuTA('😎', 20, 70, { in: 'pop', s: 1.3 }), tuTX('back', 30, 75, { d: .5, in: 'fade', mv: [[48, 40, .8, .6]] }), tuTX('back', 32, 75, { d: .7, in: 'fade', mv: [[54, 42, 1, .6]] }), tuTB('ملكتين!', 30, 40, { d: 1.8 })] },
    { t: 'صادق ولا تكذب؟ اللي بعدك يقرّر: يصدّقك… أو يقول «كذّاب!».', e: [tuTX('back', 46, 40, { in: 'fade' }), tuTX('back', 54, 42, { in: 'fade' }), tuTA('🤨', 80, 70, { in: 'pop', s: 1.3, d: .4 }), tuTS('كذّاب!', 60, 72, { d: 2.4 })] },
    { t: 'تنقلب الأوراق: لو كان كذّاب هو يخسر، ولو كان صادق اللي اتهمه يخسر.', e: [tuTC('back', '', 40, 45, { s: 1.2, ft: [.8, 'pc', 'Q'] }), tuTC('back', '', 60, 45, { s: 1.2, ft: [1.2, 'pc', 'K'] }), tuTI('😱', 60, 15, { d: 1.8, in: 'pop', s: 1.4 }), tuTT('كذب!', 60, 85, { d: 2.2, in: 'pop', c: 'r' })] },
    { t: 'والخسران يسحب الزناد: مسدس فيه ست خانات، ورصاصة وحدة بس.', e: [tuTX('cyl', 50, 45, { in: 'pop', s: 1.4, loop: 'spinonce', at: .6 }), tuTT('٦ خانات', 25, 80, { d: 1.5, in: 'up' }), tuTT('رصاصة وحدة', 75, 80, { d: 2, in: 'up', c: 'r' }), tuTX('flash', 50, 50, { d: 3.6 })] },
    { t: 'آخر واحد يبقى عايش… يفوز.', e: [...tuRing(5, 50, 50, 30, 34, { e: i => i === 2 ? { loop: 'bob', at: 1 } : { out: .6 + i * .4 } }), tuTI('👑', 50 + Math.cos(2 / 5 * Math.PI * 2 - Math.PI / 2) * 30, 50 + Math.sin(2 / 5 * Math.PI * 2 - Math.PI / 2) * 34 - 18, { d: 2.4, in: 'drop' })] }
  ],
  outside: [
    { t: 'برا السالفة: الكل يعرف الكلمة السرية… إلا واحد.', e: [...tuRing(5, 50, 58, 34, 26), ...[0, 1, 2, 3, 4].map(i => { const a = i / 5 * Math.PI * 2 - Math.PI / 2; return tuTB(i === 3 ? '؟؟' : '🍕 بيتزا', 50 + Math.cos(a) * 34, 58 + Math.sin(a) * 26 - 18, { d: 1 + i * .2, c: i === 3 ? 'r' : '' }); })] },
    { t: 'بالدور، كل واحد يسأل واحد ثاني سؤال عن الكلمة… بدون ما يقولها.', e: [tuTA('🤠', 25, 60, { in: 'pop', s: 1.4 }), tuTA('🧕', 75, 60, { in: 'pop', s: 1.4, d: .2 }), tuTB('تاكلها بالليل؟', 30, 30, { d: .8 }), tuTB('إيه أحياناً 😄', 70, 30, { d: 2.4 })] },
    { t: 'اللي برا السالفة يحاول يجاوب كأنه عارف… وأنتم دوّروا مين جوابه غريب.', e: [tuTA('😅', 50, 58, { in: 'pop', s: 1.6, loop: 'shake', at: 2 }), tuTB('ممم… أحبها حارّة؟', 50, 26, { d: .6 }), tuTI('🤔', 20, 70, { d: 1.8, in: 'pop' }), tuTI('🧐', 80, 70, { d: 2.1, in: 'pop' })] },
    { t: 'بعدها تصوّتون على مين برا السالفة.', e: [...tuRing(5, 50, 55, 34, 28, { e: i => i === 3 ? { loop: 'shake', at: 2.4 } : {} }), ...[0, 1, 2, 4].map((i, k) => tuTX('vote', 50 + Math.cos(i / 5 * Math.PI * 2 - Math.PI / 2) * 34, 55 + Math.sin(i / 5 * Math.PI * 2 - Math.PI / 2) * 28, { d: 1 + k * .3, mv: [[50 + Math.cos(3 / 5 * Math.PI * 2 - Math.PI / 2) * 34 + (k - 1.5) * 3, 55 + Math.sin(3 / 5 * Math.PI * 2 - Math.PI / 2) * 28 - 14, 1.2 + k * .3, .5]] }))] },
    { t: 'ولو انكشف، عنده فرصة أخيرة: يختار الكلمة الصح من ثمان خيارات. لو جابها يفوز!', e: ['برقر', 'شاورما', 'بيتزا', 'كبسة', 'سوشي', 'فلافل', 'مندي', 'باستا'].map((w, i) => tuTX('chip', 24 + (i % 4) * 17, 40 + (i / 4 | 0) * 22, { v: w, d: .2 + i * .08, in: 'pop', ...(w === 'بيتزا' ? { loop: 'pulse', at: 2.6, c: 'g' } : {}) })).concat([tuTI('🎉', 50, 15, { d: 3.2, in: 'pop', s: 1.6 })]) }
  ],
  typing: [
    { t: 'سبّاق الكتابة: يطلع نص قدامكم…', e: [tuTX('typebox', 50, 40, { v: 'القهوة السعودية أحلى مع التمر', in: 'type', s: 1.2 })] },
    { t: 'أسرع واحد يكتبه صح ياخذ النقطة. وما يهم التشكيل.', e: [tuTX('typebox', 50, 22, { v: 'القهوة السعودية أحلى مع التمر', in: 'fade' }), ...['😎', '🤠', '🧕'].map((a, i) => tuTX('race', 50, 50 + i * 16, { v: a, d: .3, in: 'fade', p: [1, .7, .55][i], c: ['g', 'b', 'r'][i] })), tuTI('🥇', 88, 50, { d: 2.6, in: 'pop' })] },
    { t: 'النقاط تتجمّع… وأول واحد يوصل الهدف يفوز.', e: ['😎', '🤠', '🧕'].map((a, i) => tuTX('race', 50, 34 + i * 18, { v: a, in: 'fade', p: [1, .6, .4][i], c: ['g', 'b', 'r'][i], dur: 3 })).concat([tuTS('الهدف', 86, 20, { d: 3 })]) },
    { t: 'والمضيف يختار الهدف: ثلاث، خمس، ثمان أو اثنعش نقطة.', e: ['٣', '٥', '٨', '١٢'].map((n, i) => tuTX('chip', 26 + i * 16, 50, { v: n + ' نقاط', d: .3 + i * .2, in: 'pop', ...(i === 1 ? { loop: 'pulse', at: 1.6, c: 'g' } : {}) })) }
  ],
  jackaroo: [
    { t: 'جاكارو: أنت وشريكك اللي قبالك فريق، وهدفكم تدخّلون كل كراتكم الثمان للبيت.', e: [tuTX('track', 50, 50, { in: 'pop' }), ...['r', 'b', 'g', 'y'].map((c, i) => tuTX('marble', 50 + [0, 24, 0, -24][i], 50 + [-42, 0, 42, 0][i], { c, d: .5 + i * .15, in: 'pop', s: 1.4, ...(i % 2 === 0 ? { loop: 'pulse', at: 2 } : {}) })), tuTT('شريكك', 70, 86, { d: 2, in: 'up' })] },
    { t: 'الآص والشايب يطلّعون كرة من البداية للمضمار.', e: [tuTX('track', 50, 50, { in: 'fade' }), tuTC('pc', 'A', 15, 40, { in: 'pop', s: 1.2 }), tuTC('pc', 'K', 15, 68, { in: 'pop', d: .3, s: 1.2 }), tuTX('marble', 50, 95, { c: 'r', d: .6, in: 'pop', s: 1.3, mv: [[50, 78.4, 1.6, .5]] })] },
    { t: 'باقي الأوراق تحرّك الكرة بعددها… والأربعة تمشي فيها لورا.', e: [tuTX('track', 50, 50, { in: 'fade' }), tuTC('pc', '6', 15, 50, { in: 'pop', s: 1.2 }), tuTX('marble', 50, 78.4, { c: 'r', in: 'fade', s: 1.3, mv: [[61.3, 70.1, .8, .5], [66, 50, 1.4, .5], [61.3, 29.9, 2, .5]] }), tuTC('pc', '4', 15, 50, { d: 3, in: 'pop', s: 1.2 }), tuTT('↩', 72, 18, { d: 3.4, in: 'pop', s: 1.6 })] },
    { t: 'الولد يبدّل مكانك مع أي كرة، والخمسة تحرّك أي كرة، والسبعة تقسمها على كرتين.', e: [tuTC('pc', 'J', 22, 45, { in: 'pop', s: 1.3 }), tuTT('يبدّل', 22, 80, { d: .4, in: 'up' }), tuTC('pc', '5', 50, 45, { in: 'pop', d: 1.6, s: 1.3 }), tuTT('أي كرة', 50, 80, { d: 2, in: 'up' }), tuTC('pc', '7', 78, 45, { in: 'pop', d: 3.2, s: 1.3 }), tuTT('٣ + ٤', 78, 80, { d: 3.6, in: 'up' })] },
    { t: 'ولو نزلت كرتك على كرة خصم… تاكلها وترجع لبدايتها!', e: [tuTX('track', 50, 50, { in: 'fade' }), tuTX('marble', 66, 50, { c: 'b', in: 'fade', s: 1.3, mv: [[94, 10, 1.6, .7]] }), tuTX('marble', 50, 78.4, { c: 'r', in: 'fade', s: 1.3, mv: [[61.3, 70.1, .6, .5], [66, 50, 1.2, .4]] }), tuTI('💥', 66, 40, { d: 1.4, in: 'pop', s: 1.4 })] },
    { t: 'أول فريق يدخّل كل كراته البيت يفوز.', e: [tuTX('track', 50, 50, { in: 'fade' }), ...[0, 1, 2, 3].map(i => tuTX('marble', 50, 92, { c: 'r', d: .3 + i * .2, in: 'pop', mv: [[45 + (i % 2) * 10, 44 + (i >> 1) * 12, 1.2 + i * .25, .5]] })), tuTI('🏆', 50, 14, { d: 2.4, in: 'drop', s: 1.3 })] }
  ],
  draw: [
    { t: 'رسم وخمّن: كل دور يجي لاعب يرسم كلمة سرية.', e: [tuTX('pad', 50, 50, { in: 'pop' }), tuTX('drawhouse', 50, 50, { d: .4 }), tuTB('الكلمة: بيت 🤫', 82, 18, { d: .2 })] },
    { t: 'الباقين يخمّنون بالكتابة. كل ما خمّنت أسرع، تاخذ نقاط أكثر.', e: [tuTX('pad', 34, 50, { in: 'fade' }), tuTX('drawhouse', 34, 50, { in: 'fade', fast: 1 }), tuTB('خيمة؟', 78, 22, { d: .4 }), tuTB('بيت!', 78, 44, { d: 1.5, c: 'g' }), tuTT('+١٠٠', 92, 44, { d: 2, in: 'pop', c: 'g' }), tuTB('بيت', 78, 66, { d: 2.8, c: 'g' }), tuTT('+٦٠', 92, 66, { d: 3.2, in: 'pop', c: 'g' })] },
    { t: 'والرسّام ياخذ نقاط على كل واحد يخمّن صح. فارسم زين!', e: [tuTA('🧑🏾‍🎨', 50, 50, { in: 'pop', s: 2 }), ...[0, 1, 2].map(i => tuTT('+٣٠', 40 + i * 10, 22, { d: .8 + i * .4, in: 'up', c: 'g' }))] },
    { t: 'بعد ما يرسم الكل، أعلى واحد بالنقاط يفوز.', e: ['😎', '🤠', '🧕'].map((a, i) => tuTX('podium', 30 + i * 20, 62, { v: a, h: [2, 3, 1][i], d: .2 + i * .2, in: 'up' })).concat([tuTI('👑', 50, 18, { d: 1.4, in: 'drop', s: 1.4 })]) }
  ],
  sus: [
    { t: 'المندس: أنتم طاقم سفينة… وبينكم مندس.', e: [...['r', 'b', 'g', 'y', 'o'].map((c, i) => tuTX('crew', 22 + i * 14, 58, { c, d: .1 + i * .1, in: 'up' })), tuTI('🔪', 22 + 0 * 14, 32, { d: 2.4, in: 'pop', loop: 'shake', at: 3 })] },
    { t: 'تمشي بالأسهم أو بالسحب على الشاشة، وما تشوف إلا اللي قدامك.', e: [tuTX('fogview', 50, 50, { in: 'fade' }), tuTX('crew', 50, 55, { c: 'b', in: 'pop', mv: [[60, 50, 1, 1], [40, 45, 2.4, 1.2]] })] },
    { t: 'الطاقم يخلّصون مهامهم: العلامات الصفراء.', e: [tuTX('crew', 30, 55, { c: 'b', in: 'pop' }), tuTI('⚠️', 30, 26, { d: .4, in: 'pop', loop: 'bob', at: 1 }), tuTX('bar', 65, 55, { d: .6, in: 'fade', p: 1, dur: 2.6 }), tuTT('المهام', 65, 38, { d: .6, in: 'up' })] },
    { t: 'والمندس يقتل، ويخرّب، ويتنقّل بالفتحات.', e: [tuTX('crew', 30, 55, { c: 'r', in: 'pop', mv: [[48, 72, 1.4, .5]] }), tuTX('vent', 50, 76, { in: 'pop', d: .2 }), tuTX('crew', 80, 55, { c: 'r', d: 2.2, in: 'up' }), tuTI('💀', 66, 60, { d: 3, in: 'pop' })] },
    { t: 'لقيت جثة؟ بلّغ! أو اضغط زر الطوارئ، وتتناقشون وتصوّتون على المندس.', e: [tuTX('btn', 50, 38, { v: 'بلّغ!', in: 'pop', s: 1.4, loop: 'pulse', at: .6, c: 'r' }), ...['r', 'b', 'g', 'y'].map((c, i) => tuTX('crew', 26 + i * 16, 78, { c, d: 1.6 + i * .1, in: 'up', s: .8 })), tuTS('اجتماع!', 50, 18, { d: 2.4 })] },
    { t: 'الطاقم يفوز لو خلّصوا المهام أو طردوا المندسين، والمندس يفوز لو صار عددهم نفس الطاقم.', e: [tuTX('crew', 50, 50, { c: 'r', in: 'pop', s: 1.3, mv: [[50, -20, 2, 1.4]] }), tuTT('انطرد!', 50, 80, { d: 2.4, in: 'pop', c: 'r', s: 1.4 })] }
  ],
  haunt: [
    { t: 'البيت المسكون: قصر كبير بأربع طوابق… واحد منكم شبح، والباقين ناجين معهم كشافات.', e: [tuTX('mansion', 50, 52, { in: 'up' }), tuTX('flash', 50, 50, { d: 1.2 }), tuTI('👻', 74, 30, { d: 2, in: 'pop', s: 1.6, loop: 'bob', at: 2.6 }), tuTI('🔦', 26, 74, { d: 2.4, in: 'pop', s: 1.3 })] },
    { t: 'أول شي: دوّروا ثلاث فيوزات، وركّبوها بصندوق الكهرباء في القبو.', e: [tuTX('fusebox', 70, 52, { in: 'fade', s: 1.3 }), ...[0, 1, 2].map(i => tuTI('⚡', 20 + i * 12, 30, { d: .3 + i * .3, in: 'pop', s: 1.4, mv: [[70, 40 + i * 12, 2 + i * .2, .5]] })), tuTT('رجعت الكهرباء!', 50, 86, { d: 3, in: 'pop', c: 'y' })] },
    { t: 'بعدها المفاتيح تفتح الغرف المقفلة: مكتب الجد، ثم الغرفة الكبيرة، ثم العلّية.', e: [['مكتب الجد', 'y'], ['الغرفة الكبيرة', 'w'], ['العلّية', 'r']].flatMap(([n, c], i) => [tuTI('🔒', 25 + i * 25, 42, { d: .2 + i * .9, in: 'pop', s: 1.6, out: .9 + i * .9 }), tuTI('🔓', 25 + i * 25, 42, { d: 1 + i * .9, in: 'pop', s: 1.6 }), tuTT(n, 25 + i * 25, 72, { d: .4 + i * .9, in: 'up' })]) },
    { t: 'جيبوا أربع قطع ملعونة للمذبح بالعلّية، وسوّوا الطقس… وينفتح الباب الأمامي. اهربوا!', e: [...['🪆', '🖼️', '🕯️', '📕'].map((r, i) => tuTI(r, 26 + i * 16, 30, { d: .2 + i * .25, in: 'pop', s: 1.3 })), tuTX('flash', 50, 50, { d: 2.4 }), tuTI('🚪', 50, 70, { d: 2.8, in: 'pop', s: 2 }), tuTT('اهرب!', 74, 72, { d: 3.4, in: 'pop', c: 'r' })] },
    { t: 'وجّه الكشاف على الشبح يحرقه ويجمّده… بس انتبه، البطارية تخلص.', e: [tuTX('beam', 40, 52, { in: 'fade' }), tuTI('👻', 74, 48, { in: 'pop', s: 1.8, loop: 'shake', at: 1.2 }), tuTT('🔥 انحرق!', 74, 20, { d: 1.6, in: 'pop', c: 'r' }), tuTX('bar', 26, 88, { d: 2.4, in: 'fade', p: .15, from: 1, dur: 2, c: 'y' })] },
    { t: 'أول مرة يمسكك تنحبس بقفص القبو وربعك يطلّعونك. المرة الثانية تموت. وتقدر تختبي بالدواليب.', e: [tuTX('cage', 26, 50, { in: 'drop' }), tuTI('😰', 26, 54, { d: .4, in: 'pop' }), tuTT('❤️🖤', 26, 86, { d: 1.2, in: 'up' }), tuTI('🚪', 72, 50, { d: 2.6, in: 'pop', s: 2.2 }), tuTT('🤫', 72, 50, { d: 3.2, in: 'pop', s: 1.2 })] },
    { t: 'ولو أنت الشبح: تشوف بالظلام، تصرخ عشان تطفّي كشافاتهم، وتنتقل بين المرايا. لا تخليهم يهربون!', e: [tuTI('👹', 50, 48, { in: 'pop', s: 2.6, loop: 'pulse', at: .8 }), tuTT('😱 صرخة', 22, 24, { d: 1.4, in: 'pop' }), tuTT('🪞 مرايا', 78, 24, { d: 2.2, in: 'pop' }), tuTX('flash', 50, 50, { d: 1.6, c: 'r' })] }
  ],
  mafia: [
    { t: 'المافيا: مدينة… وبين أهلها مافيا متخفّين.', e: [tuTX('city', 50, 70, { in: 'up' }), ...tuRing(6, 50, 40, 32, 18, { e: i => i === 4 ? { loop: 'blink', at: 2 } : {} }), tuTI('🎩', 50 + Math.cos(4 / 6 * Math.PI * 2 - Math.PI / 2) * 32, 40 + Math.sin(4 / 6 * Math.PI * 2 - Math.PI / 2) * 18 - 11, { d: 2.4, in: 'drop' })] },
    { t: 'بالبداية كل واحد يشوف كرت دوره بالسر. لا تفضح نفسك!', e: [tuTX('rolecard', 50, 48, { in: 'pop', s: 1.4, ft: [1.2, 'det'] }), tuTI('🤫', 76, 30, { d: 2, in: 'pop', s: 1.4 })] },
    { t: 'بالليل المدينة تنام. المافيا يختارون ضحية، والطبيب يحمي شخص، والمحقق يفتّش على واحد.', e: [tuTX('city', 50, 72, { in: 'fade', night: 1 }), tuTX('rolecard', 22, 38, { v: 'mafia', d: .6, in: 'pop', s: .8, open: 1 }), tuTX('rolecard', 50, 38, { v: 'doc', d: 1.8, in: 'pop', s: .8, open: 1 }), tuTX('rolecard', 78, 38, { v: 'det', d: 3, in: 'pop', s: .8, open: 1 })] },
    { t: 'الصبح تطلع جريدة المدينة… وتعرفون مين مات.', e: [tuTX('paper', 50, 50, { in: 'spin', v: 'العثور على جثة فلان!' })] },
    { t: 'بالنهار تتناقشون: مين المافيا؟ وبعدها تصوّتون وتطردون واحد.', e: [...tuRing(5, 50, 50, 30, 30, { e: i => i === 1 ? { loop: 'shake', at: 2.6 } : {} }), tuTB('أشك فيه!', 26, 20, { d: .6 }), tuTS('مطرود', 50 + Math.cos(1 / 5 * Math.PI * 2 - Math.PI / 2) * 30, 50 + Math.sin(1 / 5 * Math.PI * 2 - Math.PI / 2) * 30, { d: 3 })] },
    { t: 'عندنا بعد: القنّاص بطلقة وحدة، والعمدة صوته بصوتين، والمهرج يفوز لو طردتوه!', e: [tuTX('rolecard', 22, 48, { v: 'sniper', in: 'pop', s: .8, open: 1 }), tuTX('rolecard', 50, 48, { v: 'mayor', d: 1.4, in: 'pop', s: .8, open: 1 }), tuTX('rolecard', 78, 48, { v: 'jester', d: 2.8, in: 'pop', s: .8, open: 1 })] },
    { t: 'المدينة تفوز لو طلّعت كل المافيا… والمافيا تفوز لو صار عددهم نفس الباقين.', e: [tuTI('🏙️', 30, 45, { in: 'pop', s: 2.4 }), tuTT('ضد', 50, 45, { d: .6, in: 'pop' }), tuTI('🎩', 70, 45, { in: 'pop', d: .3, s: 2.4 }), tuTT('مين بيفوز؟', 50, 82, { d: 1.6, in: 'pop', c: 'y' })] }
  ],
  phone: [
    { t: 'التلفون الترتيب: كل واحد يبدأ ويكتب جملة غريبة.', e: [...tuTTring(3, 50, 62, 30, 22), tuTB('قطو يسوق جيب 🚙', 50, 18, { d: 1 }), tuTI('☎️', 50, 62, { d: .4, in: 'pop', s: 1.6, loop: 'shake', at: 1 })] },
    { t: 'الجملة تروح للي بعدك… ولازم يرسمها!', e: [tuTB('بيت وجنبه شمس', 24, 26, { d: .2 }), tuTX('arrow', 24, 52, { v: '↓', d: .7, in: 'fade', s: 1.2 }), tuTX('pad', 62, 52, { in: 'pop', d: .8 }), tuTX('drawhouse', 62, 52, { d: 1.2 }), tuTA('🧕', 30, 78, { d: .9, in: 'pop' })] },
    { t: 'والرسمة تروح للي بعده، ويكتب وش شاف فيها.', e: [tuTX('pad', 36, 50, { in: 'fade' }), tuTX('drawhouse', 36, 50, { in: 'fade', fast: 1 }), tuTA('🤠', 78, 70, { d: .5, in: 'pop' }), tuTB('خيمة بالبر؟ 🤔', 78, 34, { d: 1.4 })] },
    { t: 'وهكذا تلف على الكل… وبالآخر تنعرض كل سلسلة من أولها، وتشوفون كيف خربت المكالمة!', e: [tuTB('بيت وجنبه شمس', 50, 14, { d: .2 }), tuTX('arrow', 50, 30, { v: '↓', d: .7, in: 'fade', s: .9 }), tuTI('🏠☀️', 50, 44, { d: 1, in: 'pop', s: 1.2 }), tuTX('arrow', 50, 58, { v: '↓', d: 1.5, in: 'fade', s: .9 }), tuTB('خيمة بالبر', 50, 70, { d: 1.8 }), tuTX('arrow', 50, 82, { v: '↓', d: 2.3, in: 'fade', s: .9 }), tuTB('جمل نايم 🐪', 50, 93, { d: 2.6, c: 'r' }), tuTI('😂', 82, 50, { d: 3.2, in: 'pop', s: 2, loop: 'bob', at: 3.6 })] },
    { t: 'اضغط 😂 على أضحك شي، واللي يضحّك الناس أكثر يفوز.', e: [...[0, 1, 2, 3, 4, 5].map(i => tuTI('😂', 18 + i * 13, 90, { d: .2 + i * .25, in: 'fade', mv: [[18 + i * 13 + (i % 2 ? 4 : -4), 20, .3 + i * .25, 1.6]], out: 2 + i * .25 })), tuTA('😎', 50, 52, { d: 1.6, in: 'pop', s: 1.6 }), tuTI('👑', 50, 30, { d: 2.4, in: 'drop', s: 1.3 })] }
  ],
  fib: [
    { t: 'صدّقني: يطلع سؤال غريب، جوابه حقيقة ما يعرفها أحد.', e: [tuTX('typebox', 50, 40, { v: 'الأخطبوط عنده ___ قلوب', in: 'pop', s: 1.1 }), tuTI('🐙', 50, 76, { d: .8, in: 'pop', s: 1.6, loop: 'bob', at: 1.4 })] },
    { t: 'الكل يكتب جواب كذب… بس لازم يقنع الباقين!', e: [...tuTTring(3, 50, 62, 32, 20), tuTB('خمس', 50 + Math.cos(-Math.PI / 2) * 32, 62 + Math.sin(-Math.PI / 2) * 20 - 16, { d: .8 }), tuTB('ثمان', 50 + Math.cos(-Math.PI / 2 + 2.09) * 32, 62 + Math.sin(-Math.PI / 2 + 2.09) * 20 - 16, { d: 1.3 }), tuTB('قلبين', 50 + Math.cos(-Math.PI / 2 + 4.19) * 32, 62 + Math.sin(-Math.PI / 2 + 4.19) * 20 - 16, { d: 1.8 }), tuTI('🤥', 50, 62, { d: 2.4, in: 'pop', s: 1.4 })] },
    { t: 'بعدين تنعرض الكذبات مع الجواب الصح، وكل واحد يختار اللي يحسبه صح.', e: ['خمس', 'ثلاث', 'ثمان', 'قلبين'].map((w, i) => tuTX('chip', 26 + (i % 2) * 48, 36 + (i >> 1) * 30, { v: w, d: .2 + i * .15, in: 'pop', s: 1.3, ...(i === 1 ? { loop: 'pulse', at: 2.2, c: 'g' } : {}) })).concat([tuTI('👆', 80, 50, { d: 1.4, in: 'pop', mv: [[76, 42, 2, .5]] })]) },
    { t: 'لقيت الصح تاخذ ألف نقطة، وكل واحد ينخدع بكذبتك تاخذ لك خمسمية.', e: [tuTX('chip', 30, 36, { v: 'ثلاث ✅', in: 'pop', s: 1.4, c: 'g' }), tuTT('+١٠٠٠', 30, 64, { d: .8, in: 'pop', c: 'g', s: 1.3 }), tuTX('chip', 72, 36, { v: 'ثمان 🤥', in: 'pop', d: 1.6, s: 1.4 }), tuTT('+٥٠٠', 72, 64, { d: 2.4, in: 'pop', c: 'y', s: 1.3 }), tuTT('+٥٠٠', 72, 82, { d: 2.9, in: 'pop', c: 'y', s: 1.1 })] },
    { t: 'والجولة الأخيرة النقاط دبل! واللي نقاطه أعلى يفوز.', e: [tuTS('×٢', 50, 40, { d: .2 }), tuTI('🏆', 50, 76, { d: 1.4, in: 'drop', s: 1.6 })] }
  ],
  bomb: [
    { t: 'القنبلة: تلف بينكم، واللي معه القنبلة يطلع له مقطع حرفين.', e: [...tuTTring(4, 50, 52, 34, 34), tuTX('bomb', 50, 52, { v: 'ست', d: .8, in: 'pop', s: 1.2, loop: 'shake', at: 1.6 })] },
    { t: 'اكتب كلمة فيها المقطع، مثلاً «ست»: مستشفى… وتروح القنبلة للي بعدك.', e: [tuTX('bomb', 26, 46, { v: 'ست', in: 'pop' }), tuTX('typebox', 64, 32, { v: 'مستشفى', in: 'type', d: .5 }), tuTI('✅', 64, 56, { d: 2.6, in: 'pop', s: 1.2 }), tuTX('bomb', 26, 46, { v: 'ري', d: 3, in: 'fade', mv: [[80, 78, 3.2, .7]] })] },
    { t: 'القنبلة تنفجر بوقت عشوائي ما أحد يعرفه… واللي تنفجر بيده يخسر قلب!', e: [tuTA('😰', 30, 52, { in: 'pop', s: 1.4 }), tuTX('bomb', 58, 52, { v: 'ظل', in: 'pop', s: 1.3, loop: 'shake', at: .5 }), tuTX('flash', 50, 50, { d: 2.4, c: 'r' }), tuTI('💥', 58, 52, { d: 2.4, in: 'pop', s: 3 }), tuTT('❤️❤️🖤', 30, 82, { d: 2.9, in: 'pop' })] },
    { t: 'الكلمة لازم تكون ثلاث حروف أو أكثر، وما تتكرر.', e: [tuTX('chip', 34, 36, { v: 'من', in: 'pop', s: 1.3 }), tuTI('❌', 34, 16, { d: .8, in: 'pop' }), tuTT('قصيرة', 34, 60, { d: .9, in: 'up' }), tuTX('chip', 70, 36, { v: 'مستشفى', d: 1.6, in: 'pop', s: 1.3 }), tuTI('❌', 70, 16, { d: 2.3, in: 'pop' }), tuTT('انكتبت قبل!', 70, 60, { d: 2.4, in: 'up' })] },
    { t: 'كمّل حروف المكافأة كلها وتاخذ قلب زيادة. وآخر واحد يبقى يفوز!', e: [...[...'ابتجحدرسشع'].map((c, i) => tuTX('chip', 88 - i * 8.4, 30, { v: c, d: .2 + i * .12, in: 'pop', c: 'g' })), tuTT('+❤️', 50, 56, { d: 1.8, in: 'pop', s: 1.4 }), tuTI('👑', 50, 82, { d: 2.6, in: 'drop', s: 1.4 })] }
  ],
  auction: [
    { t: 'المزاد: كل واحد معه خمسطعش ألف ريال وهمية، وتطلع أغراض قيمتها الحقيقية مخفية.', e: [...tuTTring(3, 50, 58, 30, 26), tuTT('💰 ١٥٬٠٠٠', 50, 58, { d: .8, in: 'pop', c: 'y', s: 1.2 }), tuTI('🏺', 50, 18, { d: 1.6, in: 'drop', s: 1.6 }), tuTT('؟؟؟', 66, 18, { d: 2.2, in: 'pop' })] },
    { t: 'تتزايدون عليها: كل ما زاد أحد، الوقت يرجع من جديد… ولو ثمان ثواني محد زاد، ينباع للأعلى!', e: [tuTI('🏺', 22, 40, { in: 'pop', s: 2 }), tuTX('chip', 62, 30, { v: '+٥٠٠', d: .6, in: 'pop', c: 'g' }), tuTX('chip', 76, 46, { v: '+١٠٠٠', d: 1.3, in: 'pop', c: 'g' }), tuTX('chip', 60, 62, { v: '+٥٠٠', d: 2, in: 'pop', c: 'g' }), tuTI('🔨', 50, 80, { d: 3, in: 'pop', s: 1.8, loop: 'shake', at: 3.4 }), tuTS('بيع!', 74, 80, { d: 3.6 })] },
    { t: 'كل غرض، فيه واحد أو اثنين يوصلهم خبر سري عن قيمته الحقيقية. انتبه مين يزايد بثقة!', e: [tuTA('🤫', 30, 56, { in: 'pop', s: 1.5 }), tuTB('قيمتها بين ٤ و ٦ آلاف', 62, 34, { d: .8 }), tuTA('🧐', 78, 74, { d: 1.8, in: 'pop' })] },
    { t: 'والصناديق الغامضة يمكن فيها كنز… ويمكن خردة!', e: [tuTI('🧰', 50, 44, { in: 'pop', s: 2.4, loop: 'shake', at: .8 }), tuTI('💎', 30, 78, { d: 2, in: 'pop', s: 1.4 }), tuTT('أو', 50, 80, { d: 2.4, in: 'pop' }), tuTI('🧦', 70, 78, { d: 2.8, in: 'pop', s: 1.4 })] },
    { t: 'بالآخر نحسب: فلوسك اللي باقية مع قيمة أغراضك… والأغنى يفوز.', e: [tuTT('💰 ٨٬٠٠٠', 26, 40, { in: 'pop', s: 1.2 }), tuTT('+', 46, 40, { d: .5, in: 'pop' }), tuTT('📦 ١١٬٥٠٠', 66, 40, { d: .8, in: 'pop', s: 1.2 }), tuTT('= ١٩٬٥٠٠', 50, 66, { d: 1.6, in: 'pop', c: 'y', s: 1.4 }), tuTI('👑', 50, 88, { d: 2.4, in: 'drop' })] }
  ],
  feud: [
    { t: 'العائلة الترتيب: فريقين، ويطلع سؤال، وعلى اللوحة أشهر ست أجوبة مخفية.', e: [tuTX('typebox', 50, 16, { v: 'شي تلقاه في أي مجلس', in: 'pop' }), ...[0, 1, 2, 3, 4, 5].map(i => tuTX('tile', 66 - (i % 2) * 32, 40 + (i >> 1) * 20, { v: String(i + 1), d: .5 + i * .12, in: 'flip', c: 'b' }))] },
    { t: 'كل جولة تبدأ بمواجهة: واحد من كل فريق يكتب جواب، واللي جوابه أعلى ياخذ الدور.', e: [tuTA('😎', 22, 52, { in: 'pop', s: 1.5 }), tuTT('ضد', 50, 52, { d: .4, in: 'pop' }), tuTA('🤠', 78, 52, { in: 'pop', d: .2, s: 1.5 }), tuTB('قهوة!', 22, 22, { d: 1.2, c: 'g' }), tuTB('مكيف', 78, 22, { d: 1.6 }), tuTI('🏆', 22, 84, { d: 2.6, in: 'drop' })] },
    { t: 'فريقك يجاوب بالدور، وكل جواب صح ينقلب على اللوحة ويزيد النقاط.', e: [...[['قهوة', 30], ['تمر', 22], ['', 0], ['', 0], ['بخور', 11], ['', 0]].map(([w, p], i) => tuTX('tile', 66 - (i % 2) * 32, 30 + (i >> 1) * 22, { v: w ? w + ' ' + p : String(i + 1), in: w ? 'flip' : 'fade', d: w ? .3 + i * .5 : 0, c: w ? 'r' : 'b' })), tuTT('٦٣', 50, 92, { d: 2.4, in: 'pop', c: 'y', s: 1.3 })] },
    { t: 'ثلاث أخطاء… والفريق الثاني يقدر يسرق كل النقاط بجواب واحد صح!', e: [...[0, 1, 2].map(i => tuTI('❌', 30 + i * 20, 40, { d: .3 + i * .6, in: 'pop', s: 2 })), tuTI('🦹', 50, 78, { d: 2.4, in: 'pop', s: 1.8, loop: 'bob', at: 2.8 })] },
    { t: 'والجولة الأخيرة النقاط دبل! الفريق اللي يجمع أكثر يفوز.', e: [tuTS('×٢', 50, 34, { d: .2 }), tuTI('🏆', 50, 74, { d: 1.2, in: 'drop', s: 1.6 })] }
  ],
  flags: [
    { t: 'أعلام ودول: يطلع علم، وتختار الدولة من أربع خيارات.', e: [tuTX('flag', 50, 30, { v: 'jp', in: 'pop', s: 1.4 }), ...['اليابان', 'الصين', 'كوريا', 'بنغلاديش'].map((w, i) => tuTX('chip', 30 + (i % 2) * 40, 66 + (i >> 1) * 18, { v: w, d: .6 + i * .12, in: 'pop', ...(i === 0 ? { loop: 'pulse', at: 2, c: 'g' } : {}) }))] },
    { t: 'أو تطلع دولة وتختار علمها… أو تختار عاصمتها، حسب اختيار المضيف.', e: [tuTT('وين علم البرازيل؟', 50, 18, { in: 'pop' }), ...['br', 'ar', 'pt', 'co'].map((c, i) => tuTX('flag', 22 + i * 19, 52, { v: c, d: .5 + i * .15, in: 'pop', ...(i === 0 ? { loop: 'pulse', at: 2 } : {}) })), tuTT('🏛️ عاصمة كندا؟ أوتاوا', 50, 84, { d: 2.4, in: 'up' })] },
    { t: 'كل ما جاوبت أسرع تاخذ نقاط أكثر، وثلاث صح ورا بعض تعطيك نار 🔥.', e: [tuTX('bar', 50, 30, { in: 'fade', p: .1, from: 1, dur: 2.4, c: 'y' }), tuTT('+٩٢٠', 30, 60, { d: .8, in: 'pop', c: 'g', s: 1.3 }), tuTT('+٥٤٠', 70, 60, { d: 1.6, in: 'pop', c: 'g' }), tuTI('🔥', 50, 82, { d: 2.4, in: 'pop', s: 1.8, loop: 'pulse', at: 2.8 })] },
    { t: 'تقدر تلعبها لحالك أو مع ربعك، والأعلى نقاط يفوز.', e: [tuTI('🌍', 50, 46, { in: 'spin', s: 3 }), tuTI('👑', 50, 14, { d: 1.4, in: 'drop', s: 1.3 })] }
  ],
  mimic: [
    { t: 'الأصوات الترتيب: يطلع صوت… اسمعه زين.', e: [tuTI('🔊', 50, 46, { in: 'pop', s: 3, loop: 'pulse', at: .6 }), tuTT('يا حبيبي!', 50, 84, { d: 1, in: 'up', c: 'p' })] },
    { t: 'وبعد ثلاثة، اثنين، واحد… الكل يقلّده بالمايك بنفس الوقت!', e: [tuTT('٣', 26, 30, { d: .2, in: 'pop', s: 1.6, out: .9 }), tuTT('٢', 50, 30, { d: .9, in: 'pop', s: 1.6, out: 1.6 }), tuTT('١', 74, 30, { d: 1.6, in: 'pop', s: 1.6, out: 2.3 }), ...tuTTring(4, 50, 66, 32, 18), tuTI('🎙️', 50, 66, { d: 2.4, in: 'pop', s: 1.8, loop: 'shake', at: 2.8 })] },
    { t: 'التقييم على الإيقاع ولحن صوتك، يعني طلوع ونزول الصوت… مو خشونته.', e: [tuTX('bar', 50, 30, { in: 'fade', p: .87, dur: 2.2 }), tuTT('٨٧٪', 50, 56, { d: 2.4, in: 'pop', c: 'y', s: 1.6 }), tuTI('🎵', 22, 70, { d: .6, in: 'pop', loop: 'bob', at: 1 }), tuTI('🥁', 78, 70, { d: 1, in: 'pop', loop: 'bob', at: 1.4 })] },
    { t: 'بعدها عجلة الحظ تختار واحد: دبل، أو زيادة، أو تقليده يصير فسوة!', e: [tuTI('🎡', 50, 44, { in: 'spin', s: 3.2 }), tuTX('chip', 22, 84, { v: '✖️٢ دبل', d: 1.4, in: 'pop', c: 'g' }), tuTX('chip', 50, 84, { v: '+٢٥', d: 1.8, in: 'pop', c: 'g' }), tuTX('chip', 78, 84, { v: '💨 فسوة', d: 2.2, in: 'pop', loop: 'shake', at: 2.6 })] },
    { t: 'وتنعاد كل التقليدات وحدة وحدة… والأعلى نقاط يفوز.', e: [...tuTTring(3, 50, 50, 28, 26), tuTI('😂', 22, 22, { d: 1, in: 'pop', s: 1.4 }), tuTI('👑', 50, 12, { d: 2, in: 'drop', s: 1.3 })] }
  ]
};

// ---------- المشغّل ----------
const TU = { g: null, i: 0, playing: false, audio: null, timer: null, muted: false };
const tutHas = g => !!TUT[g];
const tuMCOL = { r: '#e8362d', y: '#ffc928', g: '#1fa35c', b: '#2a5bd7', p: '#ff4fa3', t: '#19c3d6', o: '#ff8a1f', v: '#8a4fd6', k: '#16130f', w: '#16130f', n: '#efe2c3', x: '#5a4a3a' };
function tuNode(e) {
  const d = document.createElement('div');
  d.className = 'te te-' + e.k + (e.c ? ' c-' + e.c : '');
  const face = (c, v) => {
    if (e.k === 'card') return c === 'back' ? '<i class="bk"></i>' : c === 'pc' ? `<b class="pc">${v}</b>` : c === 'w' ? `<i class="wild"></i><b>${v}</b>` : `<b>${v}</b>`;
    if (e.k === 'tile') return `<b>${e.v || ''}</b>`;
    if (e.k === 'hex') return `<b>${e.v || ''}</b>`;
    if (e.k === 'rolecard') return typeof micon === 'function' ? (c ? micon(c) + `<b>${MROLE[c].n}</b>` : '<span>🎩</span>') : '';
    return '';
  };
  if (e.k === 'card') { d.innerHTML = face(e.c, e.v); d.dataset.c = e.c; }
  else if (e.k === 'back') d.innerHTML = '<i class="bk"></i>';
  else if (e.k === 'av') d.innerHTML = `<span>${e.n}</span>`;
  else if (e.k === 'ico' || e.k === 'txt' || e.k === 'arrow') d.textContent = e.v;
  else if (e.k === 'bub') d.textContent = e.v;
  else if (e.k === 'stamp') d.textContent = e.v;
  else if (e.k === 'btn' || e.k === 'chip') d.textContent = e.v;
  else if (e.k === 'tile' || e.k === 'hex') d.innerHTML = face(e.c, e.v);
  else if (e.k === 'rolecard') d.innerHTML = e.open ? face(e.v) : face(null);
  else if (e.k === 'typebox') d.innerHTML = `<span>${e.v}</span><i class="caret"></i>`;
  else if (e.k === 'race') { d.innerHTML = `<span>${e.v}</span><i></i>`; d.style.setProperty('--p', e.p); d.style.setProperty('--dur', (e.dur || 2.2) + 's'); }
  else if (e.k === 'bar') d.innerHTML = `<i style="--p:${e.p};--f:${e.from || 0};--dur:${e.dur || 2}s"></i>`;
  else if (e.k === 'marble') d.innerHTML = '<i></i>';
  else if (e.k === 'vote') d.textContent = '🗳️';
  else if (e.k === 'podium') d.innerHTML = `<span>${e.v}</span><i style="--h:${e.h}"></i>`;
  else if (e.k === 'crew') d.innerHTML = '<i class="v"></i>';
  else if (e.k === 'cyl') d.innerHTML = [0, 1, 2, 3, 4, 5].map(i => `<i style="--k:${i}"></i>`).join('');
  else if (e.k === 'track') d.innerHTML = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/><rect x="40" y="40" width="20" height="20" rx="4"/></svg>';
  else if (e.k === 'drawhouse') d.innerHTML = `<svg viewBox="0 0 200 160" class="${e.fast ? 'fast' : ''}"><path d="M40 140V70l60-48 60 48v70z"/><path d="M84 140v-36h32v36" class="d"/><path d="M60 82h20v18H60zM120 82h20v18h-20z" class="w"/><circle cx="174" cy="30" r="16" class="s"/></svg>`;
  else if (e.k === 'mansion') d.innerHTML = '<svg viewBox="0 0 200 140"><path d="M20 140V80L60 50V30h14v12l26-20 80 58v60z"/><rect x="88" y="96" width="24" height="44" class="dr"/><rect x="40" y="90" width="14" height="14" class="wn"/><rect x="140" y="88" width="14" height="14" class="wn"/><rect x="92" y="56" width="14" height="14" class="wn"/></svg>';
  else if (e.k === 'fusebox') d.innerHTML = '<i></i><i></i><i></i>';
  else if (e.k === 'cage') d.innerHTML = '';
  else if (e.k === 'city') d.innerHTML = '<svg viewBox="0 0 300 100" preserveAspectRatio="none"><path d="M0 100V60h20V40h18v30h14V30h22v40h16V50h20v50zM130 100V45h16V30h20v70zM180 100V55h24V35h18v65zM230 100V60h20V42h26v58h24v42z"/></svg>';
  else if (e.k === 'flag') d.innerHTML = `<img src="flags/${e.v}.svg" alt="">`;
  else if (e.k === 'bomb') d.innerHTML = `<b>${e.v || ''}</b><i></i>`;
  else if (e.k === 'paper') d.innerHTML = `<b>جريدة المدينة</b><small>طبعة الصباح</small><h4>${e.v}</h4><p></p><p></p><p></p>`;
  if (e.night) d.classList.add('night');
  if (typeof e.v === 'string' && /^[+\d٠-٩]/.test(e.v)) d.classList.add('ltr');
  d.style.left = e.x + '%'; d.style.top = e.y + '%';
  d.style.setProperty('--s', e.s || 1); d.style.setProperty('--r', (e.r || 0) + 'deg');
  if (e.z) d.style.zIndex = e.z;
  return d;
}
function tuAnimate(d, e) {
  const base = `translate(-50%,-50%) rotate(${e.r || 0}deg) scale(${e.s || 1})`, delay = (e.d || 0) * 1000, A = [];
  const K = {
    pop: [{ transform: base + ' scale(0)', opacity: 0 }, { transform: base + ' scale(1.15)', opacity: 1, offset: .7 }, { transform: base, opacity: 1 }],
    up: [{ transform: base + ' translateY(120%)', opacity: 0 }, { transform: base, opacity: 1 }],
    down: [{ transform: base + ' translateY(-120%)', opacity: 0 }, { transform: base, opacity: 1 }],
    left: [{ transform: base + ' translateX(-200%)', opacity: 0 }, { transform: base, opacity: 1 }],
    right: [{ transform: base + ' translateX(200%)', opacity: 0 }, { transform: base, opacity: 1 }],
    drop: [{ transform: base + ' translateY(-260%)', opacity: 0 }, { transform: base + ' translateY(8%)', opacity: 1, offset: .75 }, { transform: base }],
    flip: [{ transform: base + ' rotateY(90deg)', opacity: 0 }, { transform: base, opacity: 1 }],
    spin: [{ transform: base + ' rotate(-720deg) scale(0)', opacity: 0 }, { transform: base, opacity: 1 }],
    fade: [{ opacity: 0, transform: base }, { opacity: 1, transform: base }]
  };
  if (e.k === 'stamp') e.in = e.in || 'stamp', K.stamp = [{ transform: base + ' scale(3) rotate(-12deg)', opacity: 0 }, { transform: base + ' rotate(-12deg)', opacity: 1 }];
  if (e.k === 'flash') { A.push(d.animate([{ opacity: 0 }, { opacity: .85 }, { opacity: 0 }], { duration: 500, delay, fill: 'both' })); return A; }
  d.style.transform = base + (e.k === 'stamp' ? ' rotate(-12deg)' : '');
  const kin = K[e.in || 'pop'] || K.pop;
  A.push(d.animate(kin, { duration: e.in === 'spin' ? 1100 : 520, delay, easing: e.in === 'drop' || e.in === 'pop' || e.in === 'stamp' ? 'cubic-bezier(.3,1.4,.5,1)' : 'cubic-bezier(.2,.8,.3,1)', fill: 'both' }));
  if (e.in === 'type') d.classList.add('typing');
  (e.mv || []).forEach(([x, y, t, dur]) => A.push(d.animate([{ left: x + '%', top: y + '%' }], { duration: (dur || .5) * 1000, delay: t * 1000, easing: 'cubic-bezier(.4,.1,.3,1)', fill: 'forwards', composite: 'replace' })));
  if (e.ft) {
    // مؤقت على شكل انميشن فاضي عشان يوقف مع الإيقاف ويلغى مع تغيير المشهد
    const [t, c, v] = e.ft, tm = d.animate([{ opacity: 1 }, { opacity: 1 }], { duration: t * 1000, composite: 'add' });
    A.push(tm);
    tm.onfinish = () => {
      if (!d.isConnected) return;
      A.push(d.animate([{ transform: base }, { transform: base + ' rotateY(90deg)' }, { transform: base }], { duration: 500, easing: 'ease-in-out', composite: 'replace' }));
      setTimeout(() => {
        if (!d.isConnected) return;
        if (e.k === 'card') { d.dataset.c = c; d.className = 'te te-card c-' + c; d.innerHTML = c === 'pc' ? `<b class="pc">${v}</b>` : c === 'w' ? `<i class="wild"></i><b>${v}</b>` : `<b>${v}</b>`; }
        else if (e.k === 'tile' || e.k === 'hex') d.className = 'te te-' + e.k + ' c-' + c;
        else if (e.k === 'rolecard') { d.innerHTML = typeof micon === 'function' ? micon(c) + `<b>${MROLE[c].n}</b>` : ''; d.classList.add('open'); }
      }, 250);
    };
  }
  if (e.loop) {
    const L = {
      pulse: [[{ transform: base }, { transform: base + ' scale(1.12)' }, { transform: base }], { duration: 800, iterations: Infinity }],
      shake: [[{ transform: base }, { transform: base + ' translateX(-6%) rotate(-4deg)' }, { transform: base + ' translateX(6%) rotate(4deg)' }, { transform: base }], { duration: 380, iterations: Infinity }],
      bob: [[{ transform: base }, { transform: base + ' translateY(-10%)' }, { transform: base }], { duration: 1100, iterations: Infinity }],
      spin: [[{ transform: base }, { transform: base + ' rotate(360deg)' }], { duration: 1600, iterations: Infinity }],
      spinonce: [[{ transform: base }, { transform: base + ' rotate(1080deg)' }], { duration: 2400, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }],
      blink: [[{ opacity: 1 }, { opacity: .3 }, { opacity: 1 }], { duration: 900, iterations: Infinity }]
    }[e.loop];
    if (L) A.push(d.animate(L[0], Object.assign({ delay: (e.at || 1) * 1000 }, L[1])));
  }
  if (e.out != null) A.push(d.animate([{ opacity: 1 }, { opacity: 0, transform: base + ' translateY(-40%) scale(.6)' }], { duration: 350, delay: e.out * 1000, fill: 'forwards' }));
  return A;
}
// آخر وقت فيه حركة بالمشهد، عشان ما ننتقل قبل لا تخلص
const tuLast = sc => Math.max(0, ...sc.e.map(e => Math.max(e.d || 0, e.out || 0, e.ft ? e.ft[0] + .5 : 0, ...(e.mv || []).map(m => m[2] + (m[3] || .5))) + .5));
function tutOpen(g, start = 0) {
  if (!TUT[g]) return;
  tutClose(true);
  TU.g = g; TU.i = start; TU.rate = 1; TU.playing = true;
  const o = document.createElement('div'); o.id = 'tutW'; o.className = 'tutw tst-' + g;
  o.innerHTML = `<div class="tutbox"><div class="tuthead"><b>شرح ${esc(GNAME[g] || '')}</b><button type="button" class="tutx" id="tutX" aria-label="سكّر">✕</button></div>
    <div class="tutstage" id="tutStage"></div>
    <p class="tutcap" id="tutCap"></p>
    <div class="tutctl"><button type="button" id="tutPrev" aria-label="اللي قبل">⏮</button><button type="button" id="tutPlay" aria-label="شغّل/وقّف">⏸</button><button type="button" id="tutNext" aria-label="اللي بعده">⏭</button>
      <div class="tutdots" id="tutDots">${TUT[g].map((_, i) => `<i data-i="${i}"></i>`).join('')}</div><button type="button" id="tutMute" aria-label="الصوت">🔊</button></div></div>`;
  document.body.appendChild(o);
  $('#tutX').onclick = () => tutClose();
  o.onclick = e => { if (e.target === o) tutClose(); };
  $('#tutPrev').onclick = () => tutGo(TU.i - 1);
  $('#tutNext').onclick = () => tutGo(TU.i + 1);
  $('#tutPlay').onclick = () => tutToggle();
  $('#tutMute').onclick = () => { TU.muted = !TU.muted; $('#tutMute').textContent = TU.muted ? '🔇' : '🔊'; if (TU.audio) TU.audio.muted = TU.muted; };
  $$('#tutDots i').forEach(d => d.onclick = () => tutGo(+d.dataset.i));
  TU.key = e => { if (e.key === 'Escape') tutClose(); else if (e.key === 'ArrowLeft') tutGo(TU.i + 1); else if (e.key === 'ArrowRight') tutGo(TU.i - 1); else if (e.key === ' ') { e.preventDefault(); tutToggle(); } };
  addEventListener('keydown', TU.key);
  try { if (typeof hMenuMusic === 'function' && typeof HMUS !== 'undefined' && HMUS) HMUS.volume = .08; } catch {}
  tutGo(start);
}
function tutClose(quiet) {
  const o = $('#tutW'); clearTimeout(TU.timer);
  if (TU.audio) { TU.audio.pause(); TU.audio = null; }
  (TU.anims || []).forEach(a => { try { a.cancel(); } catch {} });
  if (TU.key) removeEventListener('keydown', TU.key);
  if (o) { if (quiet) o.remove(); else { o.classList.add('out'); setTimeout(() => o.remove(), 300); } }
  TU.g = null;
  try { if (typeof hVolApply === 'function') hVolApply(); } catch {}
}
function tutGo(i) {
  const L = TUT[TU.g]; if (!L) return;
  if (i < 0) i = 0;
  if (i >= L.length) { tutEnd(); return; }
  TU.i = i; clearTimeout(TU.timer); TU.pend = false;
  (TU.anims || []).forEach(a => { try { a.cancel(); } catch {} });
  TU.anims = [];
  if (TU.audio) { TU.audio.pause(); TU.audio = null; }
  const st = $('#tutStage'), sc = L[i];
  st.innerHTML = '';
  sc.e.forEach(e => { const d = tuNode(e); st.appendChild(d); TU.anims.push(...tuAnimate(d, e)); });
  const cap = $('#tutCap'); cap.textContent = sc.t; cap.classList.remove('in'); void cap.offsetWidth; cap.classList.add('in');
  $$('#tutDots i').forEach((d, k) => { d.classList.toggle('on', k === i); d.classList.toggle('done', k < i); });
  TU.playing = true; $('#tutPlay').textContent = '⏸';
  // الصوت: لو موجود نمشي على طوله، وإلا وقت حسب طول الجملة
  const fallback = Math.max(4.2, sc.t.length / 11 + 1.6, tuLast(sc) + 1.3) * 1000;
  const a = new Audio(`tut/${TU.g}/${i + 1}.mp3?v=${TUTV}`); a.muted = TU.muted;
  try { a.volume = Math.min(1, (typeof sfx === 'function' && sfx.vol ? Math.max(.4, sfx.vol()) : 1)); } catch {}
  TU.audio = a; let started = false;
  const next = ms => { clearTimeout(TU.timer); TU.pend = true; TU.left = ms; TU.at = Date.now(); if (TU.playing) TU.timer = setTimeout(() => tutGo(TU.i + 1), ms); else TU.pausedAt = TU.at; };
  const s0 = Date.now(), minEnd = (tuLast(sc) + 1) * 1000;
  a.onended = () => { if (TU.audio === a && TU.playing) next(Math.max(700, minEnd - (Date.now() - s0))); };
  a.onerror = () => { if (TU.audio === a && !started) { TU.audio = null; next(fallback); } };
  const pr = a.play(); started = true;
  if (pr && pr.catch) pr.catch(() => { if (TU.audio === a) { TU.audio = null; next(fallback); } });
  // لو الملف ما حمّل بثانيتين نكمّل بدونه
  TU.timer = setTimeout(() => { if (TU.audio === a && (a.readyState < 2 || a.error)) { TU.audio = null; a.pause(); next(Math.max(500, fallback - 2000)); } }, 2000);
  try { sfx('pop'); } catch {}
}
function tutToggle() {
  TU.playing = !TU.playing; $('#tutPlay').textContent = TU.playing ? '⏸' : '▶';
  const st = $('#tutStage'); (st ? st.getAnimations({ subtree: true }) : []).forEach(a => { try { TU.playing ? a.play() : a.pause(); } catch {} });
  if (!TU.playing) {
    clearTimeout(TU.timer); TU.pausedAt = Date.now();
    if (TU.audio && !TU.audio.ended) TU.audio.pause();
  } else if (TU.pend) {
    // كان ينتظر ينتقل للمشهد الجاي: نكمّل الوقت الباقي
    const rest = Math.max(600, TU.left - (TU.pausedAt - TU.at));
    TU.left = rest; TU.at = Date.now(); TU.timer = setTimeout(() => tutGo(TU.i + 1), rest);
  } else if (TU.audio) TU.audio.play().catch(() => { if (TU.audio) { TU.audio = null; next(1500); } });
}
function tutEnd() {
  clearTimeout(TU.timer);
  const st = $('#tutStage'); if (!st) return;
  st.innerHTML = `<div class="tutend"><b>جاهز تلعب؟ 🎮</b><div><button type="button" class="btn sm" id="tutAgain">↻ عيد الشرح</button><button type="button" class="btn sm green" id="tutDone">يلا نلعب</button></div></div>`;
  $('#tutCap').textContent = '';
  $$('#tutDots i').forEach(d => d.classList.add('done'));
  $('#tutAgain').onclick = () => tutGo(0);
  $('#tutDone').onclick = () => tutClose();
}
const TUTV = 1;
// زر الشرح باللوبي
(() => {
  const r0 = render;
  render = function () {
    r0.apply(this, arguments);
    try {
      let b = $('#tutBtn');
      if (!b) { const h = $('#ghelp'); if (!h) return; b = document.createElement('button'); b.type = 'button'; b.id = 'tutBtn'; b.className = 'btn sm tutb'; b.innerHTML = '📺 شرح اللعبة بالفيديو'; h.after(b); b.onclick = () => S && tutOpen(S.game); }
      b.hidden = !(S && S.phase === 'lobby' && TUT[S.game]);
    } catch (e) { console.warn(e); }
  };
})();
