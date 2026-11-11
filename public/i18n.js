// الترجمة (عربي / English): نترجم النصوص الظاهرة في الصفحة. محتوى الألعاب (الأسئلة والكلمات) يبقى عربي.
(function () {
  const AD = '٠١٢٣٤٥٦٧٨٩', LET = 'ء-ي';
  const P = [
    // ===== عام =====
    ['ترتيب — ألعاب', 'Tarteeb — Games'], ['ترتيب — دورك!', 'Tarteeb — your turn!'], ['ترتيب', 'Tarteeb'], ['ألعاب', 'Games'], ['الألعاب', 'Games'],
    ['الألعاب صارت عندنا', 'Games are here'], ['صارت عندنا', 'are here'], ['الألعاب', 'Games'],
    ['اختر لعبة، سوّ غرفة، عطّ الكود لربعك، وابدأوا.', 'Pick a game, make a room, share the code with your friends, and start.'],
    ['اسمك', 'Your name'], ['اكتب اسمك أول', 'Type your name first'], ['اكتب اسمك', 'Type your name'], ['اختر صورتك', 'Pick your avatar'], ['اللعبة:', 'Game:'],
    ['سوّ غرفة جديدة', 'Create a new room'], ['أو ادخل بكود', 'or join with a code'], ['ادخل', 'Join'], ['الكود أربع خانات', 'The code is 4 characters'],
    ['الدعم', 'Support'], ['ديسكورد', 'Discord'], ['موقع الدعم', 'Support page'], ['ادخل ديسكورد ترتيب ←', 'Join the Tarteeb Discord →'], ['تبي تلعب مع الشلة؟', 'Want to play with the crew?'],
    ['ثبّت التطبيق', 'Install app'], ['الثيم', 'Theme'], ['تفاعل', 'React'], ['شات', 'Chat'], ['تنبيه الدور', 'Turn alerts'],
    ['نتصل بالديسكورد…', 'Connecting to Discord…'], ['ما قدرنا نربط مع الديسكورد، جرّب تعيد تشغيل اللعبة', "Couldn't connect to Discord, try restarting the game"],
    ['رابط الدعم ما انضاف بعد', 'Support link not added yet'], ['انقطع الاتصال… نرجع نتصل', 'Disconnected… reconnecting'],
    ['انثبّت التطبيق 🎉', 'App installed 🎉'], ['في سفاري: اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية»', 'In Safari: tap Share, then “Add to Home Screen”'],
    ['التنبيهات محظورة من إعدادات المتصفح', 'Notifications are blocked in your browser settings'], ['بنبّهك لما يجي دورك والصفحة بالخلفية', "We'll alert you on your turn while the page is in the background"], ['انطفى التنبيه', 'Alerts off'],
    ['اننسخ الرابط، ارسله في الديسكورد', 'Link copied, send it on Discord'], ['الكود: ', 'Code: '], ['طردك المضيف من الغرفة', 'The host kicked you from the room'], ['تطرد', 'Kick'], ['من الغرفة؟', 'from the room?'], ['تبي تطلع من اللعبة؟', 'Leave the game?'], ['تبي ترجع الكل للغرفة؟', 'Send everyone back to the lobby?'], ['أونو فليب', 'UNO Flip'], ['الوجه الفاتح', 'Light side'], ['الوجه الغامق', 'Dark side'], ['دورك — العب ورقة أو اسحب', 'Your turn — play a card or draw'], ['تحدّى', 'Challenge'], ['اقبل', 'Accept'], ['امسكه!', 'Catch!'], ['لو شكيت إنه عنده لون الطاولة تحدّاه', 'Challenge if you think they had the table color'], ['مجموع نقاط أوراق الباقين: ', 'Points left in the other hands: '], ['نقطة', 'pts'], ['ملوّن سحب لون', 'Wild Draw Color'], ['أونو فليب', "Two-sided UNO: Light (red/yellow/green/blue) and Dark (pink/teal/orange/purple). A Flip card turns the whole game to the other side. Light: Draw 1 and Wild Draw 2. Dark: Draw 5, Skip Everyone (you play again) and Wild Draw Color (the next player draws until they get that color). Wild Draw cards are only legal if you have no card of the table color, and the next player may challenge you. A card you draw can't be played. When you have one card left press UNO! or you'll be caught and draw 2."], ['نبدأ التصويت الحين؟', 'Start voting now?'], ['ابدأ التصويت الحين', 'Start voting now'], ['دورك! اختر مين تسأله', 'Your turn! Pick who to ask'], ['(اسأله بصوتك)', '(ask them out loud)'], ['جاوبت — دوري أسأل', "I answered — my turn to ask"], ['جاوب بصوتك، وبعدها اضغط', 'Answer out loud, then press'], ['يسأل', 'Asking'], ['يجاوب', 'Answering'], ['دوره يسأل', 'Turn to ask'], ['الأسئلة — ', 'Questions — '], [' يختار مين يسأل…', ' is choosing who to ask…'], ['اسمعوا السؤال والجواب…', 'Listen to the question and answer…'], ['انكشفت! اختر الكلمة الصح وتفوز', 'You were caught! Pick the right word to win'], ['اسمع الأسئلة والأجوبة وتظاهر إنك تعرف', 'Listen to the questions and answers and pretend you know'],
    // ===== المندس =====
    ['المندس', 'The Impostor'], ['من 4 إلى 10 لاعبين (والبوتات تكمّل العدد)', '4 to 10 players (bots can fill in)'], ['من 4 إلى 10 لاعبين', '4 to 10 players'], ['مهام الطاقم', 'Crew tasks'], ['الخريطة', 'Map'], ['تخريب', 'Sabotage'], ['فتحة', 'Vent'], ['اقتل', 'Kill'], ['بلّغ', 'Report'], ['استخدم', 'Use'], ['سوّ المهمة', 'Do task'], ['اجتماع طارئ', 'Emergency'], ['صلّح', 'Fix'], ['ماسك…', 'Holding…'],
    ['💡 طفّ الكهرباء', '💡 Lights off'], ['☢️ فجّر المفاعل', '☢️ Reactor meltdown'], ['اضغط بأي مكان عشان تسكّر', 'Tap anywhere to close'], ['أنت المندس 😈', "You're the Impostor 😈"], ['أنت من الطاقم 🧑‍🚀', "You're Crew 🧑‍🚀"], ['انقتلت!', 'You were killed!'], ['تقدر تكمّل مهامك كشبح 👻', 'You can finish your tasks as a ghost 👻'],
    ['تخطّي ⏭', 'Skip ⏭'], ['الأموات ما يصوّتون 👻', "Ghosts can't vote 👻"], ['تناقشوا بالشات 💬 أو بالديسكورد', 'Discuss in chat 💬 or on Discord'], ['اضغط مطوّل', 'Press and hold'], ['ابدأ', 'Start'], ['لا تطلع من النافذة لين يخلص', "Don't close until it's done"], ['اضغط الأرقام بالترتيب من 1 لين 8', 'Tap the numbers in order 1 to 8'], ['اسحب البطاقة لآخر الشريط', 'Drag the card to the end'], ['اضغط سلك من اليمين وبعدين نفس اللون باليسار', 'Tap a wire on the right, then the same color on the left'],
    ['السوالف وقت الاجتماع بس 🤫', 'Chat is only open during meetings 🤫'], ['💡 الكهرباء طافية! روحوا صلّحوها بغرفة الكهرباء', '💡 Lights are out! Fix them in Electrical'], ['👻 أنت ميت — كمّل مهامك عشان يفوز الطاقم', "👻 You're dead — finish your tasks so the crew wins"], ['👻 أنت ميت — تفرّج على الباقين', "👻 You're dead — watch the others"], ['فاز الطاقم 🧑‍🚀', 'Crew wins 🧑‍🚀'], ['فاز المندسين 😈', 'Impostors win 😈'],
    ['أنتم طاقم سفينة، وبينكم مندس (أو اثنين لو كنتم ٧ وفوق). امشِ بالأسهم/WASD أو اسحب على الشاشة. الطاقم يخلّصون مهامهم (العلامات الصفراء)، والمندس يقتل ويخرّب ويتنقّل بالفتحات. لو لقيت جثة بلّغ، أو اضغط زر الطوارئ بالكافتيريا. وقت الاجتماع تتناقشون وتصوّتون مين تطردون. الطاقم يفوز لو خلّصوا المهام أو طردوا المندسين، والمندس يفوز لو صار عدده نفس الطاقم أو انفجر المفاعل.', "You're a spaceship crew with an impostor among you (two with 7+ players). Move with arrows/WASD or drag on the screen. Crew finish their tasks (yellow marks); the impostor kills, sabotages and travels through vents. Found a body? Report it, or press the emergency button in the Cafeteria. In meetings you discuss and vote someone out. Crew win by finishing tasks or ejecting the impostors; impostors win when they equal the crew or the reactor melts down."],
    ['من 4 إلى 12 لاعب (والبوتات تكمّل العدد)', '4 to 12 players (bots can fill in)'], ['من 4 إلى 12 لاعب', '4 to 12 players'], ['عدد المندسين', 'Impostors'], ['طور الدكتور 🩺 (يعطي درع لشخص كل جولة)', 'Doctor mode 🩺 (shields one player per round)'], ['2 مندسين يحتاج 6 لاعبين، و3 يحتاج 9', '2 impostors need 6 players, 3 need 9'], ['طور الدكتور 🩺', 'Doctor mode 🩺'],
    ['الكاميرات', 'Cameras'], ['📹 الكاميرات', '📹 Cameras'], ['درع', 'Shield'], ['استخدمته', 'Used'], ['طاقم', 'Crew'], ['مندس', 'Impostor'], ['دكتور 🩺', 'Doctor 🩺'], ['اجتماع طارئ!', 'Emergency meeting!'], ['جثة!', 'Dead body!'], ['نكشف الأصوات…', 'Revealing votes…'], ['صوتي', 'My vote'], ['تخطّي:', 'Skip:'], ['🛡️ عليه درع! ما قدرت تقتله', "🛡️ They're shielded! Kill failed"], ['🛡️ الدكتور عطاك درع لين الاجتماع الجاي', '🛡️ The doctor shielded you until the next meeting'], ['🛡️ أحد حاول يقتلك… والدرع حماك!', '🛡️ Someone tried to kill you… the shield saved you!'],
    ['🩺 قرّب من أحد واضغط «درع» — يحميه من القتل لين الاجتماع الجاي', '🩺 Get close to someone and press Shield — it protects them until the next meeting'], ['أنت من الطاقم، وتقدر تعطي درع لشخص واحد كل جولة', "You're crew, and you can shield one player each round"], ['حط المؤشر بالمنطقة الخضراء واتركه', 'Drop the slider in the green zone'], ['احفظ الترتيب…', 'Memorize the order…'], ['عيده بنفس الترتيب', 'Repeat it in the same order'], ['اضغطها كلها', 'Tap them all'], ['الرمز:', 'Code:'], ['المطلوب', 'Target'], ['الحين', 'Now'], ['اضغط مطوّل يتغيّر أسرع', 'Hold to change faster'], ['جاهز', 'Ready'],
    ['الماب', 'Map'], ['🚀 السفينة', '🚀 Spaceship'], ['🌲 الغابة الملعونة (رعب)', '🌲 Cursed Forest (horror)'], ['🌲 الغابة الملعونة', '🌲 Cursed Forest'], ['ناجين', 'Survivors'], ['دقّوا الجرس!', 'Ring the bell!'], ['🔦 طفّ الأنوار', '🔦 Lights out'], ['🩸 افتح الشق', '🩸 Open the rift'], ['🔦 الأنوار طافية! روحوا شغّلوا المولّد ببرج الراديو', '🔦 Lights are out! Restart the generator at the radio tower'],
    ['كلمة سر الغرفة:', 'Room password:'], ['تم التطوير من قبل', 'Developed by'],
    // ===== ورق ورقة ثيمات =====
    ['ورق', 'Paper'], ['ليل', 'Night'], ['بحر', 'Sea'], ['غروب', 'Sunset'], ['نعناع', 'Mint'], ['ليلكي', 'Lilac'], ['ورد', 'Rose'],
    // ===== اللوبي =====
    ['غرفتكم جاهزة', 'Your room is ready'], ['غرفة ', 'Room: '], ['كود الغرفة', 'Room code'], ['انسخ رابط الدعوة', 'Copy invite link'], ['اللاعبين', 'Players'], ['المتفرجين', 'Spectators'], ['المضيف', 'Host'], ['(أنت)', '(you)'], ['بوت', 'Bot'], ['بوت ', 'Bot '], ['لاعب', 'Player'],
    ['ابدأ اللعبة', 'Start game'], ['اطلع', 'Leave'], ['خروج', 'Exit'], ['طرد', 'Kick'], ['اخلط الفرق', 'Shuffle teams'],
    ['هذي غرفة الروم الصوتي. أي واحد يشغّل اللعبة من نفس الروم ينضم هنا تلقائيًا.', 'This is the voice channel room. Anyone who launches the game from the same channel joins automatically.'],
    ['نحتاج ', 'We need at least '], [' لاعبين على الأقل، انتظر ناس يدخلون', ' players, wait for people to join'], ['كل شي جاهز، ابدأ متى ما تبي', 'All set, start whenever you like'], ['ننتظر المضيف يبدأ اللعبة', 'Waiting for the host to start'],
    ['الغرفة ممتلئة، أنت متفرّج وتنضم أول ما ينفضى مكان', "The room is full, you're a spectator and will join when a spot opens"],
    ['وضع الفرق: مفعّل ✓', 'Team mode: on ✓'], ['وضع الفرق: مطفي', 'Team mode: off'], ['وضع الفرق (يحتاج عدد زوجي، 4 أو أكثر)', 'Team mode (needs an even number, 4 or more)'],
    [' — الفرق تتناوب بالجلوس: لاعب منكم ولاعب منهم', ' — teams alternate seats: one of you, one of them'], [' — زر «اخلط الفرق» يبدّل الجلسة', ' — “Shuffle teams” changes the seating'],
    [' — كل فريق له قائد (أول واحد فيه) يشوف الألوان السرية ويعطي التلميحات', ' — each team has a spymaster (the first member) who sees the secret colors and gives clues'],
    [' — الأحمر يوصّل من فوق لتحت، والأزرق من اليمين لليسار', ' — Red connects top to bottom, Blue connects right to left'],
    [' — تلعب أوراق مقلوبة وتكذب، واللي ينكشف يسحب الزناد (روليت)', ' — you play face-down cards and bluff; whoever gets caught pulls the trigger (roulette)'],
    [' — شريكك قبالتك. لما تخلّص كراتك تلعب بكرات شريكك', ' — your partner sits opposite. When your marbles are home, you play your partner’s'],
    ['النتيجة — ', 'Score — '], ['كيف تلعب؟', 'How to play?'],
    ['اللعبة', 'Game'], ['تراكم السحب (+2 على +2 و +4 على +4)', 'Draw stacking (+2 on +2, +4 on +4)'], ['مهلة الدور ', 'Turn time '], [' ثانية', ' sec'], ['الهدف ', 'Target '], [' نقاط', ' points'],
    ['كلمات مخصصة (اختياري)', 'Custom words (optional)'], ['كلمات مخصصة ', 'Custom words '], ['(مفعّلة: ', '(active: '], ['اكتب 25 كلمة أو أكثر، كل كلمة بسطر أو افصلها بفاصلة', 'Write 25+ words, one per line or comma-separated'],
    ['حفظ الكلمات', 'Save words'], ['رجّع الكلمات العادية', 'Use default words'], ['قفل الغرفة (بدون متفرجين)', 'Lock room (no spectators)'], ['كلمة سر (اختياري)', 'Password (optional)'], ['حفظ', 'Save'],
    ['🤖 أضف بوت', '🤖 Add bot'], ['يكمّل اللاعبين الناقصين، اطرده من ✕ لو ما تبيه', 'Fills missing players, remove it with ✕'],
    ['انحفظت كلمة السر', 'Password saved'], ['انشالت كلمة السر', 'Password removed'], ['🔑 بكلمة سر', '🔑 Password'], ['🔒 مقفلة بدون متفرجين', '🔒 Locked, no spectators'], ['تراكم +2/+4', 'Stacking +2/+4'], ['مهلة الدور ', 'Turn time '], [' ث', ' s'], ['كلمات مخصصة (', 'Custom words ('],
    ['من 2 إلى 6 لاعبين', '2 to 6 players'], ['من 2 إلى 8 لاعبين', '2 to 8 players'], ['من 2 إلى 10 لاعبين، فريقين', '2 to 10 players, two teams'], ['من 2 إلى 10 لاعبين', '2 to 10 players'], ['من 3 إلى 10 لاعبين', '3 to 10 players'], ['من 4 إلى 10 لاعبين، فريقين', '4 to 10 players, two teams'], ['من 4 إلى 10 لاعبين', '4 to 10 players'],
    ['4 لاعبين بالضبط، فريقين (شريكك قبالتك)', 'Exactly 4 players, two teams (your partner sits opposite)'], ['4 لاعبين، فريقين', '4 players, two teams'],
    // أسماء الألعاب
    ['الكذابين الترتيب', 'Tarteeb Liars'], ['خلية الحروف', 'Letter Hive'], ['كلمة السر', 'Secret Word'], ['سبّاق الكتابة', 'Typing Race'], ['رسم وخمّن', 'Draw & Guess'], ['برا السالفة', 'The Outsider'], ['جاكارو', 'Jackaroo'], ['أونو', 'Uno'],
    // شرح الألعاب
    ['تخلّص من أوراقك قبل الكل. العب ورقة نفس اللون أو نفس الرقم/الرمز. لما يبقى عندك ورقة وحدة اضغط UNO! وإلا يمسكونك ويسحبك +2. الورقة اللي تسحبها ما تنلعب والدور يروح. مع «تراكم السحب» تقدر ترد +2 على +2 و+4 على +4.', 'Get rid of your cards before everyone else. Play a card of the same color or the same number/symbol. When you have one card left press UNO! or you can be caught and draw +2. With “Draw stacking” you can answer +2 with +2 and +4 with +4.'],
    ['فريقين (أ وب). كل فريق له قائد يشوف ألوان الكلمات السرية ويعطي تلميح بكلمة وحدة + رقم. الفريق يخمّن كلماته. أول فريق يكشف كل كلماته يفوز، واللي يضغط على الكلمة القاتلة يخسر فريقه.', 'Two teams (A and B). Each team has a spymaster who sees the secret colors and gives a one-word clue plus a number. The team guesses its words. The first team to reveal all its words wins, and whoever picks the assassin word loses for their team.'],
    ['لوحة خلايا حروف. الأحمر يوصّل بالطول (من فوق لتحت) والأزرق بالعرض (من اليمين لليسار). اختر خلية، جاوب على سؤال يبدأ جوابه بحرف الخلية وتصير لفريقك، واللي يكسب خلية يكمّل. لو غلطت الفريق الثاني يسرقها، ولو ما أحد جاوب تنحرق. إذا ما أحد وصّل يفوز اللي جاوب أكثر.', 'A board of letter cells. Red connects lengthwise (top to bottom), Blue connects across (right to left). Pick a cell and answer a question whose answer starts with that letter to claim it, and whoever wins a cell keeps picking. If you get it wrong the other team can steal it; if nobody answers the cell is burned. If nobody connects, the team that answered more wins.'],
    ['كل واحد يلعب 1–3 أوراق مقلوبة ويقول إنها الورقة المطلوبة (ملك أو ملكة أو آص). اللي بعده يصدّق أو يقول «كذّاب!». اللي يخسر يسحب زناد المسدس (روليت: 6 خانات وفيها رصاصة وحدة)، وآخر واحد ينجو يفوز.', 'Each player puts 1–3 cards face down and claims they are the required card (King, Queen or Ace). The next player believes it or calls “Liar!”. The loser pulls the trigger of a revolver (6 chambers, 1 bullet), and the last one standing wins.'],
    ['الكل يعرف الفئة والكلمة السرية إلا واحد (برا السالفة). كل واحد يسأل لاعب ثاني سؤال بصوته عن الكلمة بدون ما يقولها، والمسؤول يجاوب ثم يسأل غيره. بعد ما يخلص الكل تصوّتون على مين برا السالفة. لو انكشف يختار الكلمة من ٨ خيارات.', 'Everyone knows the category and the secret word except one player (the outsider). Each player asks another player a question out loud about the word without saying it; the one asked answers, then asks someone else. After everyone has had turns you vote on who the outsider is. If caught, they pick the word from 8 options.'],
    ['يطلع نص وأسرع واحد يكتبه صح ياخذ نقطة. أول واحد يوصل الهدف يفوز. ما يهم التشكيل.', 'A text appears and the fastest to type it correctly gets a point. First to the target wins. Diacritics don’t matter.'],
    ['أنت وشريكك (قبالتك) تدخلون الـ8 كرات للبيت. آص/شايب يطلّعون كرة، الباقي يحرّك بعدده، الولد يبدّل، الـ4 رجوع، الـ5 تحرّك أي كرة، الـ7 تقسّمها. اللي تنزل عليه كرتك ينأكل.', 'You and your partner (opposite) bring all 8 marbles home. Ace/King bring a marble out, other cards move that many steps, Jack swaps, 4 goes back, 5 moves any marble, 7 can be split. Whoever your marble lands on is captured.'],
    ['كل لاعب يرسم كلمة سرية والباقي يخمّنون بالكتابة. كل ما خمّنت أسرع ياخذ نقاط أكثر، والرسّام ياخذ نقاط على كل واحد يخمّن. الأعلى نقاط يفوز.', 'Each player draws a secret word while the others type guesses. The faster you guess, the more points you get, and the drawer scores for each correct guesser. Highest score wins.'],
    // ===== أونو =====
    ['اختر اللون', 'Pick a color'], ['أحمر', 'Red'], ['أصفر', 'Yellow'], ['أخضر', 'Green'], ['أزرق', 'Blue'], ['منع', 'Skip'], ['عكس', 'Reverse'], ['ملوّن', 'Wild'], ['أونو!', 'UNO!'], ['امسكه! ما قال أونو', "Catch him! He didn't say UNO"], ['مرّر', 'Pass'],
    ['ما عندك ورقة تنفع، اسحب من الكومة!', "You have no playable card, draw from the pile!"], ['العب الورقة اللي سحبتها أو مرّر', 'Play the card you drew or pass'], ['لعب الورقة اللي سحبتها أو مرّر', 'Play the card you drew or pass'], ['ما تنفع الحين', "Can't play that now"],
    ['رد بـ +', 'Answer with +'], [' أو اسحب ', ' or draw '], [' — عليه يسحب ', ' — must draw '], ['دورك!', 'Your turn!'], ['دورك', 'Your turn'], ['دور ', 'Turn: '],
    ['أنت تتفرّج 👁 — تدخل اللعبة أول ما تبدأ جولة جديدة', "You're spectating 👁 — you join when a new round starts"], ['أنت تتفرّج 👁', "You're spectating 👁"], ['تتفرّج 👁', 'Spectating 👁'], ['تتفرّج', 'Spectating'],
    ['السحب صار ', 'Draw stack is now '], [' — ورّد عليه بنفس النوع أو اسحب', ' — stack on it or draw'], [' واختار ', ' and chose '], ['انمنع', 'was skipped'], [' وانمنع', ' and was skipped'], [' سحب ورقة', ' drew a card'], [' سحب ', ' drew '],
    [' خلّص أوراقه', ' finished their cards'], [': أونو!', ': UNO!'], [' مسك ', ' caught '], [' ما قال أونو، وسحب 2', ' — forgot UNO, drew 2'], [' تأخر، انسحبت له ورقة', ' ran out of time, a card was drawn'], [' طلع من اللعبة', ' left the game'], ['انتهت اللعبة', 'Game over'], ['انلغى وضع الفرق', 'Team mode cancelled'], [' فاز، الباقين طلعوا', ' wins, the others left'],
    [' لعب ', ' played '],
    // ===== نهاية الجولة =====
    ['الجولة انتهت', 'Round over'], ['انتهت الجولة', 'Round over'], ['جولة جديدة', 'New round'], ['رجوع للوبي', 'Back to lobby'], ['ننتظر المضيف يبدأ جولة جديدة', 'Waiting for the host to start a new round'],
    ['فاز الفريق الخصم', 'The other team won'], ['فاز فريقك! 🎉', 'Your team won! 🎉'], ['فزت! 🎉', 'You won! 🎉'], ['فاز ', 'Winner: '], ['الفائزين: ', 'Winners: '], ['فاز برا السالفة', 'The outsider won'], ['فاز اللي داخل السالفة', 'The insiders won'], ['برا السالفة نجا!', 'The outsider escaped!'], ['انكشف برا السالفة!', 'The outsider was caught!'], ['انتهت اللعبة', 'Game over'],
    [' فاز', ' won'],
    // ===== فرق =====
    ['فريقك ينتظر…', 'Your team is waiting…'], ['فريقك', 'Your team'], ['الخصم', 'Opponent'], ['خصم', 'Opponent'], ['أنت مع ', "You're with "], ['خمّن مع فريقك', 'Guess with your team'],
    // ===== كلمة السر =====
    ['أنت قائد — تشوف الألوان', "You're the spymaster — you see the colors"], ['كلمة وحدة بس', 'One word only'], ['أرسل التلميح', 'Send clue'], ['اكتب التلميح', 'Type the clue'], ['ننتظر قائد', 'Waiting for the spymaster of'], ['يعطي التلميح…', 'to give the clue…'],
    ['التلميح: ', 'Clue: '], ['— باقي ', '— '], ['محاولة', 'guess left'], ['محاولات', 'guesses left'], ['أنهِ الدور', 'End turn'],
    ['التلميح ما ينفع يكون كلمة من الطاولة', "The clue can't be a word on the board"], ['قائد ', 'Spymaster '], [' كشف كل كلماته', ' revealed all its words'], [' اختار الكلمة القاتلة! ', ' picked the assassin word! '], [' اختار ', ' picked '], [' — محايدة', ' — neutral'], [' — كلمة الخصم', " — opponent's word"], [' — صح!', ' — correct!'], [' أنهى الدور', ' ended the turn'],
    [' ما بقى فيه أحد', ' has no one left'], [' صار قائد', ' became the spymaster of'], ['بدأت اللعبة — يبدأ ', 'Game started — first up: '],
    // ===== خلية =====
    ['يختار حرف', 'is picking a letter'], ['— اضغط على خلية', '— tap a cell'], ['يجاوب ', 'answering: '], ['سرقة! ', 'Steal! '], ['الجواب يبدأ بحرف ', 'Answer starts with '], ['جاوب', 'Answer'],
    ['🔴 الأحمر يوصل بالطول (من فوق لتحت)', '🔴 Red connects lengthwise (top to bottom)'], ['🔵 الأزرق يوصل بالعرض (من اليمين لليسار)', '🔵 Blue connects across (right to left)'], ['اللي يكسب خلية يكمّل', 'Whoever wins a cell keeps picking'], ['تعادل — ما أحد وصّل والعدد متساوي', 'Draw — nobody connected and the counts are equal'], [' فاز — ما أحد وصّل وجاوب أكثر (', ' won — nobody connected and they answered more ('], [' مقابل ', ' vs '], ['الأحمر: من فوق لتحت', 'Red: top to bottom'], ['الأزرق: من اليمين لليسار', 'Blue: right to left'], [' وصّل الخلية!', ' connected the hive!'], ['ما أحد جاوب — الجواب: ', 'Nobody answered — the answer: '], [' أخذ حرف ', ' took the letter '], ['انتهى الوقت', "Time's up"],
    [' غلط — الخصم يسرقها', ' wrong — the opponent can steal it'], [' غلط', ' wrong'],
    // ===== الكذابين =====
    ['ملك', 'King'], ['ملكة', 'Queen'], ['آص', 'Ace'], ['جوكر', 'Joker'], ['خطر الرصاصة', 'Bullet risk'], ['طلع', 'Out'], ['الورقة المطلوبة', 'Required card'], ['الطاولة فاضية', 'Table is empty'], [' ورقة مقلوبة', ' face-down cards'], [' وقال: ', ' and said: '],
    ['لازم تتهمه!', 'You must call him!'], ['العب ', 'Play '], ['المحدد', 'selected'], ['أوراق', 'cards'], ['ورقتين', 'cards'], ['ورقة', 'card'], ['كذّاب! ☝️', 'Liar! ☝️'], ['أقصى شي 3 أوراق', 'Max 3 cards'],
    [' قال «كذّاب!» على ', ' called “Liar!” on '], ['كان صادق!', 'He was truthful!'], ['فعلاً كذّاب!', 'Really lying!'], [' يسحب الزناد', ' pulls the trigger'], ['💥 بووم! طلع', '💥 Boom! Out'], ['نجا ✅', 'Survived ✅'],
    ['طلعت من اللعبة، تتفرّج 👁', "You're out, spectating 👁"], [' تأخر', ' ran out of time'], ['جولة ', 'Round '], [': الورقة المطلوبة ', ': required card '], [': كذّاب!', ': Liar!'], [' — كان صادق', ' — was truthful'], [' فعلاً كذّاب', ' really lying'], [' انطلقت عليه الرصاصة 💥 وطلع من اللعبة', ' took the bullet 💥 and is out'], ['المسدس عليك! 😰', 'The gun is on you! 😰'], ['المسدس على ', 'The gun is on '], ['مسدسك — خطر الرصاصة', 'Your gun — bullet risk'], ['كليك… نجا ✅', 'Click… safe ✅'], [' نجا', ' survived'], ['بدأت اللعبة — الورقة المطلوبة ', 'Game started — required card '],
    // ===== برا السالفة =====
    ['الفئة: ', 'Category: '], ['الكلمة السرية: ', 'Secret word: '], ['أنت ', 'You are '], ['— ما تعرف الكلمة. اسمع التلميحات وتظاهر إنك تعرف', "— you don't know the word. Listen to the clues and pretend you do"], ['التلميحات — الدور', 'Clues — round'], [' من ', ' of '],
    ['وقت التصويت', 'Voting time'], ['التخمين الأخير', 'Final guess'], ['اكتب التلميح', 'Type the clue'], ['تلميحك — كلمة وحدة', 'Your clue — one word'], ['أرسل', 'Send'], [' يعطي تلميح…', ' is giving a clue…'], ['التصويت شغّال…', 'Voting in progress…'], ['مين برا السالفة؟', 'Who is the outsider?'], ['اختر واحد', 'Pick one'],
    ['انكشفت! خمّن الكلمة وتفوز', 'You were caught! Guess the word to win'], ['انكشف ', 'Caught: '], [' — ينتظر يخمّن الكلمة…', ' — waiting for them to guess the word…'], ['الكلمة…', 'The word…'], ['خمّن', 'Guess'], ['برا السالفة كان: ', 'The outsider was: '], ['الكلمة: ', 'The word: '], ['تخمينه: ', 'Their guess: '],
    ['وقت التصويت — مين برا السالفة؟', 'Voting time — who is the outsider?'], [' عنده فرصة يخمّن الكلمة', ' gets a chance to guess the word'], ['ما خمّن الكلمة في الوقت', "Didn't guess the word in time"], ['صوّتوا على ', 'They voted for '], [' وكان بريء — برا السالفة نجا!', ' who was innocent — the outsider escaped!'], ['تعادل بالأصوات — برا السالفة نجا!', 'Tied vote — the outsider escaped!'], [' — واحد منكم ما يعرف الكلمة!', " — one of you doesn't know the word!"], ['لا تكتب الكلمة نفسها!', "Don't write the word itself!"], ['خمّن الكلمة صح: ', 'Guessed the word right: '], ['خمّن «', 'Guessed «'], ['والكلمة', 'and the word was'], ['برا السالفة هرب!', 'The outsider ran away!'], ['برا السالفة: ', 'The outsider: '], ['اللي داخل السالفة', 'The insiders'],
    // ===== سباق الكتابة =====
    ['أول واحد يوصل ', 'First to reach '], ['الجولة ', 'Round '], ['استعد…', 'Get ready…'], [' — النص بيظهر الحين', ' — the text appears now'], ['🏁 ', '🏁 '], [' وصل ', ' reached '], ['اكتب النص هنا…', 'Type the text here…'], ['أسرع واحد يكتبه صح ياخذ النقطة', 'The fastest to type it correctly gets the point'], [' الأسرع!', ' was fastest!'], ['ما أحد كتبها', 'Nobody typed it'], ['الجولة الجاية بعد لحظات…', 'Next round in a moment…'],
    ['ما أحد كتبها في الوقت', 'Nobody typed it in time'], [' كتبها في ', ' typed it in '], [' ثانية', ' seconds'],
    // ===== رسم =====
    ['الدور ', 'Turn '], ['اختر كلمة وارسمها:', 'Pick a word and draw it:'], [' يختار كلمة…', ' is picking a word…'], ['الكلمة كانت: ', 'The word was: '], ['ارسم: ', 'Draw: '], [' يرسم — ', ' is drawing — '], ['اكتب تخمينك…', 'Type your guess…'], ['خمّنتها ✔ انتظر الباقي', 'Got it ✔ wait for the others'], ['تراجع', 'Undo'], ['امسح', 'Clear'], ['ممحاة', 'Eraser'], ['لون', 'Color'],
    ['خمّن الكلمة!', 'guessed the word!'], [' خمّن الكلمة', ' guessed the word'], [' — الكلمة: ', ' — the word: '], ['الكل خمّن', 'Everyone guessed'], ['كل لاعب يرسم ويخمّنون — الأسرع يجمع نقاط أكثر', 'Everyone takes a turn drawing — the fastest guessers score more'], ['انتهت اللعبة', 'Game over'], [' و ', ' & '],
    // ===== جاكارو =====
    ['اختر ورقة من يدك', 'Pick a card from your hand'], ['اختر الكرة اللي تبدّل معها', 'Pick the marble to swap with'], ['اضغط على الكرة اللي تبي تحرّكها (المتوهّجة)', 'Tap the marble you want to move (the glowing ones)'], ['ننتظر دورك…', 'Waiting for your turn…'], ['قسّمت الـ7: باقي ', 'You split the 7: '], [' خطوات — اختر كرة وحرّكها', ' steps left — pick a marble and move it'],
    ['خلّصت كراتك — تلعب بكرات شريكك 🤝', "Your marbles are home — you're playing your partner's 🤝"], ['شرح اللعبة', 'How to play'], ['طلّع / 1 / 11', 'Out / 1 / 11'], ['طلّع / 13', 'Out / 13'], ['أي كرة 5', 'Any marble 5'], ['قسّمها', 'Split it'], ['بدّل', 'Swap'], ['رجوع 4', 'Back 4'], ['طلّع كرة', 'Bring a marble out'],
    ['شايب', 'King'], ['بنت', 'Queen'], ['ولد', 'Jack'], ['بدّل كرته مع كرة ', 'swapped marbles with '], ['رجّع كرة 4', 'moved a marble back 4'], ['حرّك كرة', 'moved a marble'], [' وأكل كرة ', ' and captured a marble of '], [' أكل كرة ', ' captured a marble of '], [' دخّل كل الكرات!', ' got all marbles home!'], ['وُزّعت أوراق جديدة', 'New cards dealt'], [' ما عنده حركة، رمى أوراقه', ' has no move and discarded their cards'], ['بدأت جاكارو — طلّع كراتك بالآص أو الشايب', 'Jackaroo started — bring marbles out with an Ace or a King'], ['حركة ما تنفع', "That move isn't allowed"], [' طلع، ', ' left, '],
    ['الأمر', 'Order'], ['الهدف:', 'Goal:'], 
    // ===== الشات =====
    ['اكتب رسالة…', 'Type a message…'], ['ارسل', 'Send'], ['يلا!', "Let's go!"], ['دورك', 'Your turn'], ['حظ أوفر', 'Better luck'], ['ههههه', 'Hahaha'], ['لحظة', 'One sec'], ['والله؟!', 'Really?!'], ['تسلم', 'Thanks'],
    ['الدور', 'Turn'], ['ارجع للعبة', 'Back to the game'],
    // ===== أسباب خادم =====
    ['الغرفة مقفلة، ما تقبل متفرجين', "The room is locked, no spectators"], ['المتفرجين كثير، جرّب بعدين', 'Too many spectators, try later'], ['الغرفة غير موجودة', "That room doesn't exist"], ['تم طردك من هذي الغرفة', 'You were kicked from this room'], ['كلمة السر غلط', 'Wrong password'], ['الغرفة محمية بكلمة سر', 'This room is password protected'], ['تعذّر التحقق من حساب الديسكورد', "Couldn't verify the Discord account"], ['عدد اللاعبين أكثر من المسموح لهذه اللعبة', 'Too many players for this game'], ['نحتاج 25 كلمة على الأقل (كتبت ', 'Need at least 25 words (you wrote '], ['مدري', "I don't know"], ['بدأت اللعبة', 'Game started'],
    ['الغرفة', 'Room']
  ];
  const PRE = [
    [/فاز فريق ([أب])(?![ء-ي])/g, (m, a) => `Team ${a === 'أ' ? 'A' : 'B'} won`],
    [/فريق ([أب])(?![ء-ي])/g, (m, a) => `Team ${a === 'أ' ? 'A' : 'B'}`],
    [/أول واحد يوصل (\d+) نقاط يفوز/g, 'First to reach $1 points wins'],
    [/الهدف (\d+) نقاط/g, 'Target $1 points']
  ];
  const MAP = new Map(); P.forEach(([a, e]) => { if (!MAP.has(a)) MAP.set(a, e); });
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const alts = [...MAP.keys()].sort((a, b) => b.length - a.length).map(a => {
    const L = /[ء-ي]/.test(a[0]) ? `(?<![${LET}])` : '', R = /[ء-ي]/.test(a[a.length - 1]) ? `(?![${LET}])` : '';
    return L + esc(a) + R;
  });
  const BIG = new RegExp(alts.join('|'), 'g');
  const HAS = /[؀-ۿ]/;
  function en(s) {
    s = s.replace(/[٠-٩]/g, d => AD.indexOf(d));
    for (const [re, to] of PRE) s = s.replace(re, to);
    return s.replace(BIG, m => MAP.get(m) ?? m);
  }
  const SKIP = 'script,style,textarea,.nt,[data-nt]';
  const ok = n => { const p = n.parentElement; return p && !p.closest(SKIP); };
  function doText(n) {
    if (I.lang !== 'en' || !n.nodeValue || !HAS.test(n.nodeValue) && !/[٠-٩]/.test(n.nodeValue) || !ok(n)) return;
    const o = n.nodeValue, t = en(o);
    if (t !== o) { n.__ar = o; n.__en = t; n.nodeValue = t; }
  }
  function doAttrs(el) {
    if (I.lang !== 'en' || el.closest(SKIP)) return;
    for (const a of ['placeholder', 'title', 'aria-label']) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v && HAS.test(v)) { const t = en(v); if (t !== v) { el['__ar_' + a] = v; el.setAttribute(a, t); } }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) n.nodeType === 3 ? doText(n) : doAttrs(n);
  }
  function restore(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) {
      if (n.nodeType === 3) { if (n.__ar && n.nodeValue === n.__en) n.nodeValue = n.__ar; }
      else for (const a of ['placeholder', 'title', 'aria-label']) if (n['__ar_' + a]) { n.setAttribute(a, n['__ar_' + a]); delete n['__ar_' + a]; }
    }
  }
  const I = window.I18N = {
    lang: 'ar',
    t: s => I.lang === 'en' ? en(s) : s,
    set(l, save = true) {
      I.lang = l === 'en' ? 'en' : 'ar';
      const h = document.documentElement; h.lang = I.lang; h.dir = I.lang === 'en' ? 'ltr' : 'rtl';
      try { if (save) localStorage.setItem('tarteeb-lang', JSON.stringify(I.lang)); } catch {}
      if (I.lang === 'en') walk(document.body); else restore(document.body);
      document.title = I.lang === 'en' ? 'Tarteeb — Games' : 'ترتيب — ألعاب';
      const b = document.getElementById('langBtn'); if (b) b.textContent = I.lang === 'en' ? 'ع' : 'EN';
      if (typeof lsSig !== 'undefined') lsSig = '';
      if (typeof render === 'function' && typeof S !== 'undefined' && S) render();
    }
  };
  new MutationObserver(ms => {
    if (I.lang !== 'en') return;
    for (const m of ms) {
      if (m.type === 'childList') m.addedNodes.forEach(walk);
      else if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title'] });
  let saved = 'ar'; try { saved = JSON.parse(localStorage.getItem('tarteeb-lang')) || 'ar'; } catch {}
  I.set(saved, false);
})();

// زر اللغة + شاشة البداية
(function () {
  const toggle = () => I18N.set(I18N.lang === 'en' ? 'ar' : 'en');
  const lb = document.getElementById('langBtn'); if (lb) lb.onclick = toggle;
  const sp = document.getElementById('splash'); if (!sp) return;
  const sl = document.getElementById('spLang'); sl.textContent = I18N.lang === 'en' ? 'ع' : 'EN';
  sl.onclick = e => { e.stopPropagation(); toggle(); sl.textContent = I18N.lang === 'en' ? 'ع' : 'EN'; };
  const hide = () => { if (sp.classList.contains('out')) return; sp.classList.add('out'); try { sessionStorage.setItem('tarteeb-splash', '1'); } catch {} setTimeout(() => sp.remove(), 700); };
  if (document.documentElement.classList.contains('nosplash')) return sp.remove();
  sp.addEventListener('click', hide);
  setTimeout(hide, matchMedia('(prefers-reduced-motion: reduce)').matches ? 900 : 2600);
})();
