// واجهات الألعاب الثانية: كلمة السر، خلية الحروف، الكذابين الترتيب
const GNAME = { uno: 'أونو', codes: 'كلمة السر', hive: 'خلية الحروف', liars: 'الكذابين الترتيب', outside: 'برا السالفة', typing: 'سبّاق الكتابة', jackaroo: 'جاكارو', draw: 'رسم وخمّن', flip: 'أونو فليب', sus: 'المندس', haunt: 'البيت المسكون', mafia: 'المافيا', phone: 'التلفون الترتيب', fib: 'صدّقني', bomb: 'القنبلة', auction: 'المزاد', feud: 'العائلة الترتيب', flags: 'أعلام ودول', mimic: 'الأصوات الترتيب', chess: 'شطرنج', jwb: 'جوابك الترتيب', baloot: 'بلوت', cars: 'مطاردة', rich: 'مليونير الديرة', boxing: 'حلبة الملاكمة', brawl: 'ساحة القتال', tartayb: 'تراتيب', redlight: 'إشارة حمرا خضرا', bwb: 'بلاد ولد بنت', elim: 'مسابقة الإقصاء', emo: 'خمّن المثل', chairs: 'الكراسي الموسيقية', deal: 'ترتيب ديل', qfl: 'ترتيب قفل' };
const GINFO = { qfl: 'من ٢ إلى ٦ لاعبين (والبوتات تكمّل)', deal: 'من ٢ إلى ٦ لاعبين (والبوتات تكمّل)', chairs: 'من ٢ إلى ٤٢ لاعب (والبوتات تكمّل)', emo: 'من ١ إلى ٤٢ لاعب (والبوتات تكمّل)', elim: 'من ١ إلى ٤٢ لاعب (والبوتات تكمّل)', bwb: 'من ١ إلى ٤٢ لاعب (والبوتات تكمّل)', redlight: 'من ١ إلى ٤٢ لاعب (والبوتات تكمّل)', tartayb: 'من ١ إلى ٤٢ لاعب (والبوتات تكمّل)', brawl: 'من ٢ إلى ٨ لاعبين (والبوتات تكمّل)', boxing: 'من ٢ إلى ٨ لاعبين (والبوتات تكمّل)', rich: 'من ٢ إلى ٦ لاعبين (والبوتات تكمّل)', cars: 'من ٢ إلى ٤٢ لاعب (والبوتات تكمّل)', chess: 'لاعبين، أو أنت ضد بوت (والباقين يتفرجون)', jwb: 'من ٢ إلى ٤٢ لاعب (والبوتات تكمّل)', baloot: '٤ لاعبين، فريقين (والبوتات تكمّل)', mimic: 'من ١ إلى ٨ لاعبين (يحتاج مايك)', auction: 'من ٢ إلى ٤٢ لاعب (والبوتات تكمّل)', feud: 'من ٢ إلى ٤٢، فريقين (والبوتات تكمّل)', flags: 'من ١ إلى ٤٢ لاعب (والبوتات تكمّل)', phone: 'من ٣ إلى ٤٢ لاعب', fib: 'من ٣ إلى ٤٢ لاعب (والبوتات تكمّل)', bomb: 'من ٢ إلى ٤٢ لاعب (والبوتات تكمّل)', mafia: 'من ٥ إلى ٤٢ لاعب (والبوتات تكمّل)', haunt: 'من ٢ إلى ٤٢ لاعب (ثري دي، والبوتات تكمّل)', sus: 'من ٤ إلى ٤٢ لاعب (والبوتات تكمّل العدد)', flip: 'من ٢ إلى ٨ لاعبين', uno: 'من ٢ إلى ٨ لاعبين', codes: 'من ٤ إلى ٤٢ لاعب، فريقين', hive: 'من ٢ إلى ٤٢ لاعب، فريقين', liars: 'من ٢ إلى ٨ لاعبين', outside: 'من ٣ إلى ٤٢ لاعب', typing: 'من ٢ إلى ٤٢ لاعب', jackaroo: '٤ لاعبين بالضبط، فريقين (شريكك قبالتك)', draw: 'من ٢ إلى ٤٢ لاعب' };
const BOTGAMES = ['qfl', 'deal', 'chairs', 'emo', 'elim', 'bwb', 'redlight', 'tartayb', 'brawl', 'boxing', 'rich', 'cars', 'baloot', 'jwb', 'chess', 'auction', 'feud', 'flags', 'fib', 'bomb', 'mafia', 'uno', 'hive', 'liars', 'jackaroo', 'outside', 'typing', 'flip', 'sus', 'haunt'];
const GHELP = {
  qfl: "لعبة سكرو بمجلس ثري دي. قدامك ٤ أوراق مقلوبة وتشوف الثنتين القريبة منك أول الجولة بس، والهدف أقل مجموع. بدورك اسحب من الكومة أو خذ المكشوفة وبدّلها بورقة من عندك، أو ارمها واستخدم قدرتها: ٧ و٨ تشوف ورقتك، ٩ و١٠ تشوف ورقة غيرك، بدّل (بدون ما تشوف)، عين (ورقة من كل خصم أو ورقتين لك)، شوف وبدّل (تشوف ورقتك وورقة خصم وتقرر)، خذ بس (خصم ياخذ ورقة زيادة)، زي بعض (تتخلص من ورقة)، وعلى كيفك (تختار أي قدرة). عندك ورقة نفس رقم المكشوفة؟ اضغط «نفس الرقم» وارمها بأي وقت، والغلط عقوبة. لما تحس أوراقك قليلة قل «قفّل!» والباقين لهم لفة وحدة، بعدها تنكشف الأوراق. اللي قفّل ومو الأقل نقاطه دبل. الخضرا −١ أحسن ورقة والحمرا ٢٥ أسوأ وحدة",
  deal: "جمّع أراضي المدن السعودية على طاولة خشب ثري دي. كل دور تسحب ورقتين وتلعب ٣ حركات: تحط أرض (ويطلع معلم المدينة)، أو تحط فلوس بالبنك، أو تلعب ورقة حركة تسرق وتطالب بالإيجار. «لا شكراً» تلغي أي حركة عليك. أول واحد يكمّل ٣ مدن يفوز. فيه مدينة مفضلة، أحداث كل ٥ أدوار، مزاد، وتحالفات (والخيانة لها غرامة).",
  chairs: "كلكم بالمجلس تدورون حول الدلة 🎵 والطقاقة شغالة، والطراحات أقل منكم بوحدة. أول ما توقف الطقاقة اضغط على أي طرّاحة فاضية (أو مسافة تقعد على أقرب وحدة لك). اللي ما يلقى مكان يطلع 💀، وتنشال طرّاحة كل جولة لين يبقى واحد. انتبه: اللي يضغط قبل ما توقف يتأخر شوي بالجولة!",
  emo: "يجيكم مثل عربي مشهور مكتوب بالإيموجي في قروب 💬 وتحته خانات بعدد حروف كل كلمة. اكتب المثل وأرسله: أجوبتك الغلط تطلع للكل بالقروب، والصح ما ينكشف. كل شوي ينكشف حرف كتلميح، بس النقاط تقل (٣٠ ← ١٠)، وأول واحد يحلها ياخذ ٥ نقاط زيادة. لو كتبت قريب مرة من الجواب يجيك تنبيه «قريب».",
  elim: "سؤال على الشاشة و٤ خيارات ملونة 🎤 اختار الجواب قبل ما يخلص الوقت (أو اضغط ١ ٢ ٣ ٤ بالكيبورد). اللي يغلط أو ما يجاوب يطلع 💀، أو يخسر قلب لو اخترتوا نظام القلوب من الإعدادات. الأسئلة تصعب مع الوقت، وآخر واحد يبقى هو الفايز. لو كل الباقين غلطوا بنفس السؤال محد يطلع.",
  bwb: "يطلع حرف ✏️ واكتب بكل خانة كلمة تبدأ فيه: اسم، جماد، حيوان، بلاد، نبات. أول واحد يعبّي كل الخانات يقدر يضغط «ستوب»، وبعدها الكل عنده ٥ ثواني بس. بعدها تنكشف أجوبة الكل: الجواب اللي محد كتبه غيرك = ١٠ نقاط، المكرر = ٥، الغلط أو الفاضي = ٠. الكلمة اللي باللعبة تعرفها تنقبل، ولو شفتها غلط اضغط عليها وتنلغي لو صوّت أغلب اللاعبين. والكلمة اللي اللعبة ما تعرفها (عليها ؟) ما تنحسب إلا لو أغلب الباقين ضغطوا إنها صح. وتحت تشوف ورقتك: حرف، اسم، جماد، حيوان، بلاد، نبات، مجموع. (ال التعريف ما تنحسب: «البحرين» تنفع لحرف الباء)",
  redlight: "كلكم بشارع وبآخره إشارة مرور 🚦 اضغط مطوّل (أو مسافة / ↑) عشان تركض. أول ما تقلب حمرا فكّ الزر فوراً: اللي يتحرك وهي حمرا يطلع 💀. اللي يوصل خط النهاية قبل ما يخلص الوقت ينجا، والباقين يطلعون. كل سباق أصعب من اللي قبله (الأخضر يقصر، وأحياناً تقلب حمرا بدون أصفر)، ويكملون لين يبقى واحد. الشخصيات نفس شخصيات البيت المسكون، وشكلك اللي اخترته هناك يطلع هنا.",
  baloot: '٤ لاعبين فريقين، وشريكك قبالك. كل واحد ياخذ ٥ أوراق وتنكشف ورقة بالنص. بالدور: «حكم» يعني نوع الورقة المكشوفة هو الحكم، «صن» بدون حكم، أو «بس». لو محد اشترى تصير جولة ثانية تختار فيها أي نوع ثاني. بعدها تكمل الأوراق ٨ لكل واحد. لازم تنزل من نفس النوع لو عندك، وبالحكم لو ما عندك لازم تقطع بالحكم (إلا لو شريكك ماسك الأكلة). بالحكم: الولد ثم التسعة أقوى شي. المشاريع (سرا، خمسين، مية، أربعمية، بلوت) تنحسب تلقائي. لو الفريق المشتري ما جاب أكثر من النص تصير «خسرانة» وتروح كل النقاط للخصم. أول فريق يوصل ١٥٢ يفوز.',
  jwb: 'كل جولة يطلع سؤال مثل «شي تاكله مع الرز». الكل يكتب أجوبته بنفس الوقت (لين ٣ أجوبة). بعدها تنكشف أشهر ٦ أجوبة من استبيان: لو جوابك منها تاخذ نقاطه، وكل ما كان أشهر نقاطه أكثر. ولو لاعب ثاني كتب نفس جوابك تاخذون +٥ عن كل واحد (جوابك جوابهم 🤝). آخر جولة النقاط دبل، واللي يجمع أكثر يفوز.',
  chess: 'شطرنج بالقوانين الكاملة: التبييت (القلعة)، الأكل بالمرور، ترقية العسكري، كش وكش مات، والتعادلات. اضغط على قطعتك وتطلع لك النقاط اللي تقدر تروح لها، أو اسحبها. تقدر تلعب ضد صاحبك، أو ضد البوت (أضف بوت باللوبي واختر صعوبته). فيه ساعة اختيارية (٣+٢، ٥ دقايق، ١٠ دقايق)، وتقدر تعرض تعادل أو تستسلم.',
  mimic: 'يطلع صوت (رياكشن مشهور أو صوت غريب). اسمعه زين، وبعد ٣… ٢… ١ الكل يقلّده بالمايك بنفس الوقت. التقييم على إيقاعك ولحن صوتك (طلوع ونزول الصوت) وطوله، مو على خشونة صوتك. بعدها عجلة الحظ تختار واحد: دبل، أو +٢٥، أو تقليده يصير فسوة 💨! وبعدين تنعاد كل التقليدات وحدة وحدة. الأعلى نقاط يفوز. لازم تسمح للموقع يستخدم المايك.',
  auction: 'كل واحد معه ١٥ ألف ريال وهمية. تطلع أغراض قيمتها الحقيقية مخفية، وتتزايدون عليها (+١٠٠، +٥٠٠…). لو محد زاد ٨ ثواني ينباع للأعلى. كل غرض فيه واحد (أو اثنين) يوصله خبر سري عن قيمته الحقيقية، فانتبه مين يزايد بثقة! الصناديق الغامضة يمكن فيها كنز ويمكن خردة. بالآخر: فلوسك + قيمة أغراضك، والأغنى يفوز.',
  feud: 'فريقين. يطلع سؤال وعلى اللوحة أشهر ٦ أجوبة مخفية. كل جولة تبدأ بمواجهة: واحد من كل فريق يكتب جواب، واللي جوابه أعلى ياخذ الدور لفريقه. بعدها فريقه يجاوب بالدور، وكل جواب صح ينكشف ويزيد النقاط. ٣ أخطاء ❌❌❌ والفريق الثاني يقدر يسرق كل النقاط بجواب واحد صح. الجولة الأخيرة النقاط ×٢.',
  flags: 'يطلع علم أو دولة، وتختار الجواب من ٤ خيارات: اسم الدولة، أو علمها، أو عاصمتها (حسب اختيار المضيف). الصح ياخذ ٥٠٠ نقطة + لين ٥٠٠ زيادة على السرعة، و٣ صح ورا بعض 🔥 تعطيك ١٠٠ زيادة. تقدر تلعبها لحالك.',
  phone: 'كل واحد يكتب جملة غريبة. الجملة تروح للي بعدك ويرسمها، والرسمة تروح للي بعده ويكتب وش شاف، وهكذا لين تلف على الكل. بالآخر تنعرض كل سلسلة من أولها وتشوفون كيف «خربت» المكالمة 😂. اضغط 😂 على أضحك شي، واللي يضحّك الناس أكثر يفوز.',
  fib: 'يطلع سؤال غريب جوابه حقيقة ما يعرفها أحد. الكل يكتب جواب كذب يقنع. بعدها تنعرض كل الأجوبة مع الجواب الصح، وكل واحد يختار اللي يحسبه صح. لقيت الصح = ١٠٠٠ نقطة، وكل واحد ينخدع بكذبتك = ٥٠٠ لك. الجولة الأخيرة النقاط دبل.',
  bomb: 'القنبلة تلف بينكم، واللي معه القنبلة يطلع له مقطع حرفين (مثل «ست»). اكتب كلمة فيها المقطع (٣ حروف أو أكثر، وما تتكرر) وتروح القنبلة للي بعدك. القنبلة تنفجر بوقت عشوائي، واللي تنفجر بيده يخسر قلب. آخر واحد يبقى يفوز. كمّل حروف المكافأة كلها وتاخذ قلب زيادة.',
  mafia: 'مدينة فيها مافيا متخفين بين الناس. بالبداية كل واحد يشوف كرت دوره بالسر. بالليل: المافيا يختارون ضحية (ويتكلمون بشات سري)، الطبيب يحمي شخص، المحقق يفتّش على شخص ويعرف هو مافيا ولا لا (الأب الروحي يطلع بريء)، والقناص عنده طلقة وحدة باللعبة. الصبح تطلع جريدة المدينة بأسماء الضحايا. بالنهار تتناقشون بصوت الديسكورد أو بالشات، وبعدها تصوّتون على شخص تطردونه. العمدة يقدر يكشف نفسه وصوته يصير بصوتين، والمهرج يفوز لو المدينة صوّتت عليه. المدينة تفوز لو طلّعت كل المافيا، والمافيا تفوز لو صار عددهم نفس الباقين.',
  haunt: 'لعبة رعب ثري دي بمنظور العين داخل قصر كبير بأربع طوابق (قبو، أرضي، علوي، علّية). واحد منكم شبح (اثنين لو كنتم ٧ أو أكثر) والباقين ناجين معهم كشافات. القصة بمراحل: دوّروا ٣ فيوزات وركّبوها بصندوق الكهرباء في القبو، بعدها المفاتيح تفتح مكتب الجد ثم الغرفة الكبيرة ثم العلّية، جيبوا ٤ قطع ملعونة للمذبح بالعلّية وسوّوا الطقس، وبعدها ينفتح الباب الأمامي وتهربون. الكشاف لو انوجّه على الشبح يحرقه ويجمّده، بس البطارية تخلص. أول مرة يمسكك الشبح تنحبس بقفص القبو وربعك يقدرون يطلّعونك، والمرة الثانية تموت. تقدر تختبي بالدواليب. الشبح يشوف بالظلام، يصرخ عشان يطفّي الكشافات، وينتقل بين المرايا. الكمبيوتر: WASD للمشي، الماوس للف، Shift للركض، F الكشاف، E استخدم، M الخريطة، Q صرخة الشبح. الجوال: يسار الشاشة للمشي (اسحب للآخر عشان تركض)، ويمينها للف. اللعبة تاخذ قريب نص ساعة، والناجين يفوزون لو هرب نصهم أو أكثر.',
  sus: 'أنتم طاقم سفينة وبينكم مندسين (١–٣ حسب اختيار المضيف). امشِ بالأسهم/WASD أو اسحب على الشاشة. ما تشوف إلا اللي قدامك، والغرف الثانية ظلام. الطاقم يخلّصون مهامهم (العلامات الصفراء)، والمندس يقتل ويخرّب ويتنقّل بالفتحات. غرفة المراقبة فيها كاميرات للممرات. لو لقيت جثة بلّغ، أو اضغط زر الطوارئ بالكافتيريا. وبطور الدكتور: الدكتور يعطي درع لشخص واحد كل جولة يحميه من القتل لين الاجتماع الجاي. الطاقم يفوز لو خلّصوا المهام أو طردوا المندسين، والمندس يفوز لو صار عددهم نفس الطاقم أو انفجر المفاعل.',
  flip: 'أونو بوجهين: فاتح (أحمر/أصفر/أخضر/أزرق) وغامق (وردي/تركوازي/برتقالي/بنفسجي). ورقة «فليب» تقلب كل اللعبة للوجه الثاني. الفاتح: +١ و+٢ ملوّن، والغامق: +٥ و«منع الكل» (تلعب مرة ثانية) و«ملوّن سحب لون» (الخصم يسحب لين يطلع له اللون). +٢ والسحب لون ما تنلعب إلا لو ما عندك لون الطاولة، ومن بعدك يقدر يتحدّاك. الورقة اللي تسحبها ما تنلعب. لو بقي عندك ورقة اضغط UNO! وإلا يمسكونك ويسحبك ٢.',
  uno: 'تخلّص من أوراقك قبل الكل. العب ورقة نفس اللون أو نفس الرقم/الرمز. لما يبقى عندك ورقة وحدة اضغط UNO! وإلا يمسكونك ويسحبك +٢. مع «تراكم السحب» تقدر ترد +٢ على +٢ و+٤ على +٤.',
  codes: 'فريقين (أ وب). كل فريق له قائد يشوف ألوان الكلمات السرية ويعطي تلميح بكلمة وحدة + رقم. الفريق يخمّن كلماته. أول فريق يكشف كل كلماته يفوز، واللي يضغط على الكلمة القاتلة يخسر فريقه.',
  hive: 'لوحة خلايا حروف. الأحمر يوصّل بالطول (من فوق لتحت) والأزرق بالعرض (من اليمين لليسار). اختر خلية، جاوب على سؤال يبدأ جوابه بحرف الخلية وتصير لفريقك، واللي يكسب خلية يكمّل. لو غلطت الفريق الثاني يسرقها، ولو ما أحد جاوب تنحرق. إذا ما أحد وصّل يفوز اللي جاوب أكثر.',
  liars: 'كل واحد يلعب ١–٣ أوراق مقلوبة ويقول إنها الورقة المطلوبة (ملك أو ملكة أو آص). اللي بعده يصدّق أو يقول «كذّاب!». اللي يخسر يسحب زناد المسدس (روليت: ٦ خانات وفيها رصاصة وحدة)، وآخر واحد ينجو يفوز.',
  outside: 'الكل يعرف الفئة والكلمة السرية إلا واحد (برا السالفة). كل واحد يسأل لاعب ثاني سؤال بصوته عن الكلمة بدون ما يقولها، والمسؤول يجاوب ثم يسأل غيره. بعد ما يخلص الكل تصوّتون على مين برا السالفة. لو انكشف يختار الكلمة من ٨ خيارات.',
  typing: 'يطلع نص وأسرع واحد يكتبه صح ياخذ نقطة. أول واحد يوصل الهدف يفوز. ما يهم التشكيل.',
  tartayb: 'تطلع لكم حروف ملخبطة على قطع خشب 🔤 رتّبها وطلّع الكلمة (فيه تلميح عن نوعها). أسرع واحد يرتبها صح ياخذ النقطة، والكلمات تكبر مع الجولات. اضغط القطع بالترتيب أو اكتب بالكيبورد: ⌫ تراجع، Enter أرسل، مسافة تلخبط القطع.',
  brawl: 'لعبة قتال ١ ضد ١ ⚔️ تختار مقاتلك من ٦ شخصيات، لكل وحدة صحة وسرعة وقوة وقدرتين خاصة وسوبر. المباراة أفضل من ٣ جولات (٦٠ ثانية)، والفايز يبقى بالساحة ويجيه المتحدي اللي بعده. 🛡 الصد يخفف الضرر بس المسكات والضربات الأرضية ما تنصد. عدّاد السوبر يتعبى لما تضرب أو تنضرب. كمبيوتر: ←/→ أو A/D مشي، S صد، J لكمة، K ركلة، U وI القدرات، O السوبر. وتقدر تلعب بيد التحكم.',
  boxing: 'ملاكمة ١ ضد ١ 🥊 والباقين يتفرجون ويشجعون. الفايز يبقى بالحلبة ويجيه المتحدي اللي بعده، وأول واحد يوصل عدد الانتصارات يصير البطل. 👊 جاب سريع، 💥 خطاف قوي، 🚀 أبركت يدوّخ (يحتاج طاقة). 🛡 الدفاع يخفف الضربة، و↩️ المراوغة تفوّتها وتفتح خصمك. واضرب لما خصمك يحضّر ضربته = كاونتر 🔥 (ضرر أكثر ويلغي ضربته). كمبيوتر: J K L للضرب، S أو مسافة دفاع، A/D مراوغة.',
  rich: 'لعبة عقارات بمدن السعودية 💰 ترمي النرد وتمشي، تشتري الأماكن اللي تنزل عليها، ولما تملك مجموعة كاملة (نفس اللون) تبني بيوت وفنادق ويزيد الإيجار. اللي ينزل على عقارك يدفع لك. تقدر تعرض على أحد تشتري عقاره (اضغط على الخانة). كروت الحظ ممكن تفيدك أو تورّطك، والتوقيف تطلع منه بـ٥٠ أو دبل. اللي يفلس يطلع، والأغنى بالنهاية يفوز.',
  cars: 'مطاردة سيارات بالمدينة 🚓 الصياد عليه سيارة بإنارة شرطة ويصدم الهاربين، واللي ينصاد يصير صياد معه. امشِ بالأسهم/WASD أو اسحب على الشاشة أو بيد التحكم، والمسافة (أو زر ⚡) نيترو. الهارب ياخذ نقطة كل ثانية و٢٠ لو نجا للنهاية، والصياد ١٥ عن كل صيدة. أكثر نقاط بعد الجولات يفوز.',
  jackaroo: 'أنت وشريكك (قبالتك) تدخلون الـ٨ كرات للبيت. آص/شايب يطلّعون كرة، الباقي يحرّك بعدده، الولد يبدّل، الـ٤ رجوع، الـ٥ تحرّك أي كرة، الـ٧ تقسّمها. اللي تنزل عليه كرتك ينأكل.',
  draw: 'كل لاعب يرسم كلمة سرية والباقي يخمّنون بالكتابة. كل ما خمّنت أسرع ياخذ نقاط أكثر، والرسّام ياخذ نقاط على كل واحد يخمّن. الأعلى نقاط يفوز.'
};
const TN = ['أ', 'ب'], TCOL = ['#e8362d', '#2a5bd7'];
const me2 = () => S.players.find(p => p.id === S.me);
const nameOf = id => (S.players.find(p => p.id === id) || {}).name || '؟';
const cd2 = () => Math.max(0, Math.ceil((S.left - (Date.now() - S.t0)) / 1000));

// ---- اختيار اللعبة بالرئيسية ----
let SEL = 'uno';
function pickGame(g) {
  SEL = g;
  $$('.game[data-game]').forEach(a => a.classList.toggle('sel', a.dataset.game === g));
  $('#gname').textContent = GNAME[g]; $('#ginfo').textContent = GINFO[g];
}
$$('.game[data-game]').forEach(a => a.onclick = () => pickGame(a.dataset.game));
pickGame('uno');

// ---- تصنيف الألعاب بالرئيسية ----
const GCAT = {
  bots: BOTGAMES,
  teams: ['baloot', 'codes', 'hive', 'jackaroo', 'feud'],
  big: ['qfl', 'deal', 'chairs', 'elim', 'bwb', 'redlight', 'tartayb', 'brawl', 'boxing', 'rich', 'cars', 'jwb', 'mafia', 'sus', 'bomb', 'flags', 'phone', 'feud', 'haunt', 'codes', 'hive', 'outside', 'typing', 'draw', 'fib', 'auction'],
  words: ['emo', 'tartayb', 'jwb', 'codes', 'hive', 'outside', 'typing', 'draw', 'fib', 'feud', 'flags', 'bomb', 'phone'],
  cards: ['baloot', 'uno', 'flip', 'liars', 'jackaroo', 'chess', 'auction']
};
// البحث: يطابق الاسم العربي والإنجليزي وأسماء ثانية معروفة، ويتجاهل الهمزات والتشكيل
const GALIAS = { sus: 'among us امونق اس امنق المندس impostor', haunt: 'haunted house البيت المسكون رعب horror', uno: 'uno اونو', flip: 'uno flip اونو فليب', jackaroo: 'jackaroo جاكارو', baloot: 'baloot بلوت ورق', chess: 'chess شطرنج', mafia: 'mafia مافيا', codes: 'codenames كود نيمز', hive: 'hex حروف خلية', liars: 'liars bar roulette رولت كذابين', typing: 'typing race سباق كتابه', draw: 'draw guess skribbl رسم', outside: 'spyfall برا السالفه', bomb: 'bomb party قنبله', flags: 'flags countries اعلام دول', feud: 'family feud عائله', fib: 'fibbage صدقني', phone: 'gartic phone تلفون', auction: 'auction مزاد', mimic: 'voices اصوات', jwb: 'جوابك', cars: 'cars chase tag سيارات مطارده صيد', rich: 'monopoly مونوبولي مونوبلي عقارات بنك فلوس زهر نرد مليونير', boxing: 'boxing box fight ملاكمه بوكس قتال مضاربه حلبه', brawl: 'tekken street fighter fight brawl تيكن قتال مضاربه شخصيات ساحه فايتنق', tartayb: 'tarateeb scramble anagram word تراتيب ترتايب ترتيب حروف ملخبطه كلمات ترتيب الحروف سكرابل', redlight: 'red light green light squid game لعبة الحبار اشاره حمرا خضرا سباق ركض', bwb: 'بلاد ولد بنت حيوان نبات جماد ستوب stop country boy girl', elim: 'مسابقه اقصاء اسئله quiz trivia كويز مليونير ثقافه', emo: 'خمن المثل امثال ايموجي emoji proverbs امثال شعبيه', chairs: 'كراسي موسيقيه musical chairs طراحات مجلس طقاقه', deal: 'ترتيب ديل مونوبولي ديل monopoly deal سعودي ديل اوراق مدن', qfl: 'سكرو screw skru ترتيب قفل قفل كوت اوراق' };
const gNorm = s => String(s || '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/\s+/g, ' ').trim();
let gFilt = 'all';
function gApply() {
  const L = GCAT[gFilt], q = gNorm(($('#gSearch') || {}).value);
  let n = 0;
  $$('.game[data-game]').forEach(a => {
    const k = a.dataset.game, h = a.querySelector('h3');
    const hay = gNorm([k, h && h.textContent, GNAME[k], GALIAS[k]].join(' '));
    const show = (!L || L.includes(k)) && (!q || q.split(' ').every(w => hay.includes(w)));
    a.hidden = !show; if (show) n++;
  });
  const none = $('#gNone'); if (none) none.hidden = n > 0;
  const x = $('#gSearchX'); if (x) x.hidden = !q;
}
$$('.gfilter button').forEach(b => b.onclick = () => {
  gFilt = b.dataset.f;
  $$('.gfilter button').forEach(x => x.classList.toggle('on', x === b));
  gApply();
});
if ($('#gSearch')) {
  $('#gSearch').addEventListener('input', gApply);
  $('#gSearch').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const f = $$('.game[data-game]').find(a => !a.hidden); if (f) { f.scrollIntoView({ block: 'center', behavior: 'smooth' }); f.focus({ preventScroll: true }); } } else if (e.key === 'Escape') { e.target.value = ''; gApply(); } });
  $('#gSearchX').onclick = () => { $('#gSearch').value = ''; gApply(); $('#gSearch').focus(); };
}

// ---- لعبة عشوائية: تقليب سريع بين الكروت ثم يوقف على وحدة ----
$('#rndGame').onclick = () => {
  const btn = $('#rndGame'); if (btn.disabled) return; btn.disabled = true;
  const cards = $$('.game[data-game]').filter(a => !a.hidden), n = cards.length;
  if (!n) { btn.disabled = false; return; }
  const end = Math.floor(Math.random() * n), steps = n + end;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = reduce ? steps : 0;
  const tick = () => {
    cards.forEach(c => c.classList.remove('flash'));
    const c = cards[i % n];
    if (i >= steps) {
      btn.disabled = false; pickGame(c.dataset.game);
      c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      c.classList.add('picked'); setTimeout(() => c.classList.remove('picked'), 900);
      try { sfx('pop'); } catch (e) {}
      return;
    }
    c.classList.add('flash'); i++; try { sfx('tick'); } catch (e) {}
    setTimeout(tick, 28 + Math.pow(i / steps, 3) * 180);
  };
  tick();
};

// ---- اللوبي ----
function renderTeamsOther(isHost) {
  $('#teamrow').hidden = !isHost || !S.teams;
  $('#teamBtn').hidden = true; $('#shuffleBtn').hidden = false;
  const sl = $('#scoreline'); sl.hidden = !(S.score[0] + S.score[1] > 0);
  sl.textContent = `النتيجة — فريق أ ${S.score[0]} : ${S.score[1]} فريق ب`;
  const tip = { codes: ' — كل فريق له قائد (أول واحد فيه) يشوف الألوان السرية ويعطي التلميحات', hive: ' — الأحمر يوصّل من فوق لتحت، والأزرق من اليمين لليسار', liars: '', jackaroo: ' — شريكك قبالتك. لما تخلّص كراتك تلعب بكرات شريكك', feud: ' — الفرق تتوزع بالتناوب حسب ترتيب الجلوس' }[S.game];
  if (S.teams) $('#hint').textContent += tip + ' — زر «اخلط الفرق» يبدّل الجلسة';
  else if (S.game === 'liars') $('#hint').textContent += ' — تلعب أوراق مقلوبة وتكذب، واللي ينكشف يسحب الزناد (روليت)';
}
$('#quit2').onclick = () => window.quitGame();
$('#leave2b').onclick = () => send({ t: 'leave' });
$('#again2').onclick = () => send({ t: 'again' });
$('#mute2').textContent = sfx.on() ? '🔊' : '🔇';
$('#mute2').onclick = () => { $('#mute2').textContent = sfx.toggle() ? '🔊' : '🔇'; $('#mute').textContent = $('#mute2').textContent; };
$('#specBtn2').onclick = () => { const p = $('#specPanel2'); p.hidden = !p.hidden; if (!p.hidden) drawSpecPanel2(); };
function drawSpecPanel2() {
  const host = S.players.find(p => p.h), amHost = !S.spec && host && host.id === S.me;
  $('#specPanel2').innerHTML = '<b>المتفرجين</b>' + S.specs.map(p => `<div>${esc(p.name)}${p.id === S.me ? ' <em>(أنت)</em>' : ''}${amHost ? `<button class="kick" data-id="${p.id}" title="طرد">✕</button>` : ''}</div>`).join('');
}

// نحفظ اللي كتبه اللاعب لما تنعاد الرسمة
function keep(el, fn) {
  const saved = {}; el.querySelectorAll('input,select').forEach(i => { saved[i.id] = [i.value, document.activeElement === i]; });
  fn();
  el.querySelectorAll('input,select').forEach(i => { const s = saved[i.id]; if (s) { i.value = s[0]; if (s[1]) { i.focus(); try { i.setSelectionRange(i.value.length, i.value.length); } catch {} } } });
}

function renderOther() {
  const m = me2(), mt = m ? m.tm : null;
  $('#g2name').textContent = GNAME[S.game];
  $('#g2sub').textContent = S.spec ? 'تتفرّج' : !S.teams ? '' : `أنت مع فريق ${TN[mt]}`;
  $('#specBtn2').hidden = !S.specs.length; $('#specN2').textContent = S.specs.length;
  if (!S.specs.length) $('#specPanel2').hidden = true; else if (!$('#specPanel2').hidden) drawSpecPanel2();
  const body = $('#g2body');
  if (body.dataset.built && body.dataset.built !== S.game) { body.innerHTML = ''; body.dataset.built = ''; }
  body.className = 'g2body ' + S.game;
  keep(body, () => ({ codes: renderCodes, hive: renderHive, liars: renderLiars, outside: renderOutside, typing: renderTyping, jackaroo: renderJack, draw: renderDraw, flip: renderFlip, sus: renderSus, haunt: renderHaunt, mafia: renderMafia, phone: renderPhone, fib: renderFib, bomb: renderBomb, auction: renderAuction, feud: renderFeud, jwb: renderJwb, baloot: renderBaloot, cars: renderCars, rich: renderRich, boxing: renderBox, brawl: renderBrawl, tartayb: renderTartayb, qfl: renderQfl, deal: renderDeal, chairs: renderChairs, emo: renderEmo, elim: renderElim, bwb: renderBwb, redlight: renderRedlight, flags: renderFlags, mimic: renderMimic, chess: renderChess })[S.game](body, mt));
  // نهاية الجولة
  const over = S.phase === 'over';
  $('#over2').hidden = !over;
  if (over) {
    const g = S.g || {}, amSpy = g.role === 'spy';
    if (S.game === 'haunt') $('#winner2').textContent = (g.win === 'surv' ? 'فاز الناجين 🔦' : 'فاز الشبح 👻') + (S.spec || !g.me ? '' : (g.win === 'ghost') === !!g.me.ghost ? ' — فزت!' : ' — خسرت');
    else if (S.game === 'phone') $('#winner2').textContent = S.winner && S.winner !== 'انتهت اللعبة' ? '😂 أضحك واحد: ' + S.winner : 'انتهت المكالمة 📞';
    else if (S.game === 'mafia') $('#winner2').textContent = (g.win === 't' ? 'فازت المدينة 🏙️' : g.win === 'm' ? 'فازت المافيا 🎩' : 'فاز المهرج 🃏') + (S.spec || !g.me ? '' : (g.win === 'j' ? g.jWin === S.me : g.win === (MROLE[g.me.role] || {}).team) ? ' — فزت!' : ' — خسرت');
    else if (S.game === 'sus') $('#winner2').textContent = (g.win === 'crew' ? 'فاز الطاقم 🧑‍🚀' : 'فاز المندسين 😈') + (S.spec || !g.me ? '' : (g.win === 'imp') === !!g.me.imp ? ' — فزت!' : ' — خسرت');
    else if (S.game === 'outside') $('#winner2').textContent = S.spec ? (g.spyWins ? 'فاز برا السالفة' : 'فاز اللي داخل السالفة') : g.spyWins === amSpy ? 'فزت! 🎉' : (g.spyWins ? 'برا السالفة نجا!' : 'انكشف برا السالفة!');
    else $('#winner2').textContent = S.teams && S.winTeam != null ? (S.spec ? 'فاز ' + S.winner : S.winTeam === mt ? 'فاز فريقك! 🎉' : 'فاز ' + S.winner) : (S.winner === (m && m.name) ? 'فزت! 🎉' : S.winner === 'انتهت اللعبة' || S.winner === 'تعادل' ? S.winner : 'فاز ' + S.winner);
    const wt = $('#winteam2'); wt.hidden = !(S.teams && S.winTeam != null);
    if (S.game === 'sus') { wt.hidden = false; wt.innerHTML = susOverHtml(g); }
    else if (S.game === 'haunt') { wt.hidden = false; wt.innerHTML = hauntOverHtml(g); }
    else if (S.game === 'mafia') { wt.hidden = false; wt.innerHTML = mafiaOverHtml(g); }
    else if (!wt.hidden) wt.textContent = 'الفائزين: ' + S.players.filter(p => p.tm === S.winTeam).map(p => p.name).join(' و ');
    $('#board2').innerHTML = [...S.players].sort((a, b) => b.w - a.w).map(p => `<li${p.id === S.me ? ' class="me"' : ''}><span>${esc(p.name)}</span><b>🏆 ${p.w}</b></li>`).join('');
    const host = S.players.find(p => p.h);
    $('#again2').hidden = S.spec || !(host && host.id === S.me);
    $('#waitHost2').hidden = !$('#again2').hidden;
  }
  fx2();
  tick2();
}
const logHtml = () => `<div class="g2log">${S.log.slice(-2).map(esc).join('<br>')}</div>`;

// ================= كلمة السر =================
function renderCodes(body, mt) {
  const g = S.g, over = S.phase === 'over';
  const mine = mt === g.turn, spy = g.role === 'spy';
  const cls = c => c.open ? 'open k' + (c.k === -1 ? 'n' : c.k === -2 ? 'x' : c.k) : c.k !== null ? 'hint k' + (c.k === -1 ? 'n' : c.k === -2 ? 'x' : c.k) : '';
  let mid;
  if (over) mid = `<div class="clue">${esc(S.winner)} فاز</div>`;
  else if (g.sub === 'clue') {
    mid = mine && spy ? `<form class="clueform" id="clueForm"><input id="clueWord" maxlength="20" placeholder="كلمة وحدة بس" autocomplete="off"><select id="clueN">${[...Array(10).keys()].map(i => `<option${i === 2 ? ' selected' : ''}>${i}</option>`).join('')}</select><button class="btn green sm">أرسل التلميح</button></form>`
      : `<div class="clue">ننتظر قائد <b style="color:${TCOL[g.turn]}">فريق ${TN[g.turn]}</b> يعطي التلميح…</div>`;
  } else mid = `<div class="clue">التلميح: <b class="cw nt">${esc(g.clue.word)}</b> <i class="cn">${g.clue.n}</i> <span class="muted">— باقي ${g.left} ${g.left === 1 ? 'محاولة' : 'محاولات'}</span>${g.can ? ' <button id="endTurn" class="btn sm">أنهِ الدور</button>' : ''}</div>`;
  body.innerHTML = `
    <div class="cbar"><span class="tc t0${g.turn === 0 && !over ? ' on' : ''}">فريق أ <b>${g.remain[0]}</b></span><span class="role">${spy ? 'أنت قائد — تشوف الألوان' : S.spec ? 'تتفرّج' : 'خمّن مع فريقك'}</span><span class="tc t1${g.turn === 1 && !over ? ' on' : ''}"><b>${g.remain[1]}</b> فريق ب</span></div>
    ${mid}
    <div class="cboard">${g.cards.map((c, i) => `<button class="cc ${cls(c)}${g.can && !c.open ? ' go' : ''}" data-i="${i}"${g.can && !c.open ? '' : ' tabindex="-1"'}><span class="nt">${esc(c.w)}</span></button>`).join('')}</div>
    ${logHtml()}`;
  body.querySelectorAll('.cc.go').forEach(b => b.onclick = () => send({ t: 'guess', i: +b.dataset.i }));
  const f = $('#clueForm'); if (f) f.onsubmit = e => { e.preventDefault(); const w = $('#clueWord').value.trim(); if (!w) return toast('اكتب التلميح'); send({ t: 'clue', word: w, n: +$('#clueN').value }); $('#clueWord').value = ''; };
  const et = $('#endTurn'); if (et) et.onclick = () => send({ t: 'end' });
}

// ================= خلية الحروف =================
const HS = 34, R3 = Math.sqrt(3);
const hexPts = (cx, cy, a0 = 30) => [0, 1, 2, 3, 4, 5].map(k => { const a = (a0 + 60 * k) * Math.PI / 180; return `${(cx + HS * Math.cos(a)).toFixed(1)},${(cy + HS * Math.sin(a)).toFixed(1)}`; }).join(' ');
const vtx = (cx, cy, deg) => { const a = deg * Math.PI / 180; return [(cx + HS * Math.cos(a)).toFixed(1), (cy + HS * Math.sin(a)).toFixed(1)]; };
const hc = (r, c) => [HS * R3 * (c + r / 2) + HS * R3 / 2 + 8, HS * 1.5 * r + HS + 8];
function renderHive(body, mt) {
  const g = S.g, over = S.phase === 'over';
  const W = HS * R3 * 7 + 16, H = HS * 1.5 * 4 + HS * 2 + 16;
  const myPick = !S.spec && g.sub === 'pick' && mt === g.turn && !over;
  let cells = '', edges = '';
  g.cells.forEach((c, i) => {
    const r = i / 5 | 0, cc = i % 5, [x, y] = hc(r, cc);
    const fill = c.o === 0 ? TCOL[0] : c.o === 1 ? TCOL[1] : c.o === 2 ? '#8b8478' : 'var(--surf2)';
    const sel = g.cell === i;
    cells += `<g class="hx${c.o === null && myPick ? ' go' : ''}${sel ? ' sel' : ''}" data-i="${i}"><polygon points="${hexPts(x, y)}" style="fill:${sel ? '#ffc928' : fill}"/><text x="${x}" y="${y + 1}" style="fill:${c.o !== null && !sel ? '#fff' : sel ? '#16130f' : 'var(--ink)'}">${c.o === 2 ? '✕' : esc(c.l)}</text></g>`;
  });
  const line = (pts, col) => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
  let top = [], bot = [], lef = [], rig = [];
  for (let c = 0; c < 5; c++) { const [x, y] = hc(0, c); top.push(vtx(x, y, 210), vtx(x, y, 270), vtx(x, y, 330)); const [x2, y2] = hc(4, c); bot.push(vtx(x2, y2, 150), vtx(x2, y2, 90), vtx(x2, y2, 30)); }
  for (let r = 0; r < 5; r++) { const [x, y] = hc(r, 0); lef.push(vtx(x, y, 210), vtx(x, y, 150), vtx(x, y, 90)); const [x2, y2] = hc(r, 4); rig.push(vtx(x2, y2, 270), vtx(x2, y2, 330), vtx(x2, y2, 30)); }
  edges = line(top, TCOL[0]) + line(bot, TCOL[0]) + line(lef, TCOL[1]) + line(rig, TCOL[1]);
  let panel;
  if (over) panel = `<div class="hq"><b>${g.end === 'tie' ? 'تعادل — ما أحد وصّل والعدد متساوي' : g.end === 'count' ? esc(S.winner) + ' فاز — ما أحد وصّل وجاوب أكثر (' + g.counts[S.winTeam] + ' مقابل ' + g.counts[1 - S.winTeam] + ')' : esc(S.winner) + ' وصّل الخلية!'}</b></div>`;
  else if (g.sub === 'pick') panel = `<div class="hq"><span class="tc t${g.turn} on">فريق ${TN[g.turn]}</span> يختار حرف ${myPick ? '— اضغط على خلية' : ''} <span class="cd2"></span></div>`;
  else {
    const mineA = !S.spec && mt === g.answering;
    panel = `<div class="hq big"><div class="hl nt">${esc(g.q.l)}</div><div class="qt nt">${esc(g.q.q)}</div>
      <div class="who"><span class="tc t${g.answering} on">${g.sub === 'steal' ? 'سرقة! ' : ''}يجاوب فريق ${TN[g.answering]}</span> <span class="cd2"></span></div>
      ${mineA ? `<form id="ansForm" class="clueform"><input id="ansIn" maxlength="40" placeholder="الجواب يبدأ بحرف ${esc(g.q.l)}" autocomplete="off"><button class="btn green sm">جاوب</button></form>` : '<div class="muted">فريقك ينتظر…</div>'}</div>`;
  }
  const team = t => `<div class="hteam t${t}"><b>فريق ${TN[t]}</b> ${S.players.filter(p => p.tm === t).map(p => `<span class="pchip" data-id="${p.id}">${p.av ? esc(p.av) + ' ' : ''}${esc(p.name)}${p.w ? ` <i>🏆${p.w}</i>` : ''}</span>`).join('')}</div>`;
  body.innerHTML = `${team(0)}${team(1)}
    <svg class="hboard" viewBox="-12 -12 ${(W + 24).toFixed(0)} ${(H + 24).toFixed(0)}">${edges}${cells}</svg>
    <div class="hint2">🔴 الأحمر يوصل بالطول (من فوق لتحت) &nbsp;•&nbsp; 🔵 الأزرق يوصل بالعرض (من اليمين لليسار) &nbsp;•&nbsp; اللي يكسب خلية يكمّل</div>
    ${panel}${logHtml()}`;
  body.querySelectorAll('.hx.go').forEach(el => el.onclick = () => send({ t: 'pick', i: +el.dataset.i }));
  const f = $('#ansForm'); if (f) { f.onsubmit = e => { e.preventDefault(); const t = $('#ansIn').value.trim(); if (!t) return; send({ t: 'answer', text: t }); $('#ansIn').value = ''; }; }
}


// ---- المسدس (روليت) ----
let gunSeen = '';
function gunSvg(pulls, hit) {
  const ch = [];
  for (let k = 0; k < 6; k++) {
    const a = (k * 60 - 90) * Math.PI / 180, x = 120 + 44 * Math.cos(a), y = 132 + 44 * Math.sin(a);
    let inner = '<circle r="15" fill="#16130f"/>';
    if (hit && k === pulls - 1) inner = '<circle r="15" fill="#16130f"/><circle r="11" fill="#e0a526" stroke="#7a5410" stroke-width="2"/><circle r="4" fill="#fff3b0"/>';
    else if (k < pulls) inner = '<circle r="15" fill="#3b372f"/><path d="M-7-7L7 7M7-7L-7 7" stroke="#8b8478" stroke-width="3" stroke-linecap="round"/>';
    ch.push(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${inner}</g>`);
  }
  return `<svg class="gunsvg" viewBox="0 0 240 250" aria-hidden="true">
    <ellipse cx="124" cy="240" rx="82" ry="8" fill="rgba(0,0,0,.18)"/>
    <rect x="90" y="196" width="60" height="46" rx="14" fill="#8a5a2b" stroke="#16130f" stroke-width="5"/>
    <circle cx="120" cy="38" r="27" fill="#aeb4bf" stroke="#16130f" stroke-width="5"/>
    <circle cx="120" cy="38" r="12" fill="#16130f"/><circle cx="115" cy="33" r="3" fill="#6b7280"/>
    <rect x="112" y="60" width="16" height="22" fill="#aeb4bf" stroke="#16130f" stroke-width="4"/>
    <g class="cyl" style="transform-origin:120px 132px">
      <circle cx="120" cy="132" r="78" fill="#c9ced8" stroke="#16130f" stroke-width="6"/>
      <circle cx="120" cy="132" r="68" fill="none" stroke="#8d94a3" stroke-width="3"/>
      ${ch.join('')}
      <circle cx="120" cy="132" r="13" fill="#8d94a3" stroke="#16130f" stroke-width="4"/>
    </g>
  </svg>`;
}

// ================= الكذابين الترتيب =================
const LNAME = { K: 'ملك', Q: 'ملكة', A: 'آص', J: 'جوكر' }, LSYM = { K: '♚', Q: '♛', A: 'A', J: '★' };
let lsel = new Set();
const lcard = (t, extra = '') => `<span class="lc c${t}${extra}"><b>${LSYM[t]}</b><small>${LNAME[t]}</small></span>`;
function renderLiars(body) {
  const g = S.g, over = S.phase === 'over', myTurn = g.turn === S.me && g.sub === 'play' && !over;
  lsel = new Set([...lsel].filter(id => g.hand.some(c => c.id === id)));
  if (!myTurn) lsel.clear();
  const chips = S.players.map(p => {
    const q = g.pl.find(x => x.id === p.id) || {}, risk = 6 - (q.pulls || 0);
    return `<div class="lp${q.alive ? '' : ' dead'}${g.turn === p.id && g.sub === 'play' && !over ? ' cur' : ''}${p.on ? '' : ' off'}" data-id="${p.id}">
      <div class="av" style="background:${PAL[S.players.indexOf(p) % 4]};color:${S.players.indexOf(p) % 4 === 3 ? '#16130f' : '#fff'}">${q.alive ? face(p) : '💀'}</div>
      <div class="nm">${esc(p.name)}${p.w ? ` <i>🏆${p.w}</i>` : ''}</div>
      ${q.alive ? `<div class="backs">${'<i></i>'.repeat(Math.min(q.n, 6))}<span class="cnt">${q.n}</span></div><div class="risk" title="خطر الرصاصة">🔫 <bdi dir="ltr">1/${risk}</bdi></div>` : '<div class="risk">طلع</div>'}
      ${g.turn === p.id && g.sub === 'play' && !over ? '<div class="arrow"><b class="cd2"></b>▼</div>' : ''}</div>`;
  }).join('');
  let center;
  const res = g.result;
  if (res && g.sub === 'result') {
    center = `<div class="lres"><div class="rl">${esc(nameOf(res.caller))} قال «كذّاب!» على ${esc(nameOf(res.liar))}</div>
      <div class="rc">${res.cards.map((t, i) => lcard(t, ' flip" style="animation-delay:' + i * 150 + 'ms')).join('')}</div>
      <div class="rv ${res.truthful ? 'tr' : 'ly'}">${res.truthful ? 'كان صادق!' : 'فعلاً كذّاب!'}</div>
      <div class="rb">${esc(nameOf(res.loser))} يسحب الزناد (${res.pulls}/6): <b>${res.hit ? '💥 بووم! طلع' : 'كليك… نجا ✅'}</b></div></div>`;
  } else {
    center = `<div class="ltable"><div class="need">الورقة المطلوبة ${lcard(g.table)}</div>
      <div class="pile">${g.pile ? `<span class="pc">${Math.min(g.pile, 8) ? '<i></i>'.repeat(Math.min(g.pile, 8)) : ''}</span> ${g.pile} ورقة مقلوبة` : 'الطاولة فاضية'}</div>
      <div class="lastp">${g.last ? `${esc(nameOf(g.last.by))} لعب ${g.last.n} وقال: <b>${LNAME[g.table]}</b>` : ''}</div>
      <div class="turnl">${over ? '' : myTurn ? (g.must ? 'لازم تتهمه!' : 'دورك!') : `دور ${esc(nameOf(g.turn))}`}</div></div>`;
  }
  const hand = g.hand.map(c => `<button class="lc c${c.t}${lsel.has(c.id) ? ' sel' : ''}" data-id="${c.id}"${myTurn && !g.must ? '' : ' disabled'}><b>${LSYM[c.t]}</b><small>${LNAME[c.t]}</small></button>`).join('');
  const acts = myTurn ? `${g.must ? '' : `<button id="putBtn" class="btn green"${lsel.size ? '' : ' disabled'}>العب ${lsel.size ? lsel.size + ' ' + (lsel.size > 1 ? 'أوراق' : 'ورقة') : 'المحدد'}</button>`}${g.last ? '<button id="callBtn" class="btn red">كذّاب! ☝️</button>' : ''}` : '';
  const resNow = g.sub === 'result' && res ? res : null, myq = g.pl.find(x => x.id === S.me) || {};
  const gkey = resNow ? [resNow.loser, resNow.pulls, resNow.cards.join('')].join('-') : '', gAnim = !!resNow && gkey !== gunSeen;
  if (resNow) gunSeen = gkey; else if (!over) gunSeen = '';
  const gunPulls = resNow ? resNow.pulls : (myq.pulls || 0), imLoser = resNow && resNow.loser === S.me;
  const gunBox = S.spec || (!resNow && !myq.alive) || over ? '' : `<div class="gunbox${resNow ? ' live' : ''}${gAnim ? ' anim' : ''}${resNow && resNow.hit ? ' hit' : ''}${imLoser ? ' mine' : ''}">
      <div class="gunin"><div class="gunwrap">${gunSvg(gunPulls, resNow && resNow.hit)}</div>
      <div class="guntxt">${resNow ? (imLoser ? 'المسدس عليك! 😰' : 'المسدس على ' + esc(nameOf(resNow.loser))) : 'مسدسك — خطر الرصاصة <bdi dir="ltr">1/' + (6 - (myq.pulls || 0)) + '</bdi>'}</div>
      ${gAnim ? `<div class="gflash ${resNow.hit ? 'bang' : 'click'}"></div>` : ''}</div>`;
  body.innerHTML = `<div class="lrow">${chips}</div>${center}
    <div class="lhand">${S.spec ? '<div class="spectag2">أنت تتفرّج 👁</div>' : !g.alive ? '<div class="spectag2">طلعت من اللعبة، تتفرّج 👁</div>' : `<div class="acts">${acts}</div><div class="hand2">${hand}</div>`}</div>${gunBox}${logHtml()}`;
  body.querySelectorAll('.hand2 .lc').forEach(b => b.onclick = () => {
    const id = +b.dataset.id; if (lsel.has(id)) lsel.delete(id); else if (lsel.size < 3) lsel.add(id); else toast('أقصى شي ٣ أوراق');
    sfx('pop'); renderLiars(body);
  });
  const pb = $('#putBtn'); if (pb) pb.onclick = () => { send({ t: 'put', ids: [...lsel] }); lsel.clear(); };
  const cb = $('#callBtn'); if (cb) cb.onclick = () => { send({ t: 'call' }); lsel.clear(); };
}

// ---- مؤثرات وأصوات ----
function fx2() {
  const p = prevS, s = S; if (!p || !s || p.game !== s.game) return;
  const g = s.g, pg = p.g; if (!g || !pg) return;
  if (s.game === 'liars') {
    if (g.turn === s.me && pg.turn !== s.me && g.sub === 'play') sfx('turn');
    if (g.sub === 'result' && pg.sub !== 'result') { [0, 140, 280, 420, 560, 700].forEach(t => setTimeout(() => sfx('tick'), t)); setTimeout(() => sfx(g.result.hit ? 'bang' : 'gclick'), 1000); }
    else if (g.pile > pg.pile) sfx('card');
  } else if (s.game === 'codes') {
    if (g.cards.filter(c => c.open).length > pg.cards.filter(c => c.open).length) sfx('card');
    if (g.clue && (!pg.clue || pg.clue.word !== g.clue.word)) sfx('uno');
  } else if (s.game === 'jackaroo') {
    if (g.turn === g.seat && pg.turn !== pg.seat) sfx('turn');
    const kills = (g.marb || []).flat().filter(x => x < 0).length, pk = (pg.marb || []).flat().filter(x => x < 0).length;
    if (kills > pk) sfx('catch'); else if (JSON.stringify(g.marb) !== JSON.stringify(pg.marb)) sfx('card');
  } else if (s.game === 'draw') {
    if (g.sub === 'choose' && pg.sub !== 'choose' && g.drawer === s.me) sfx('turn');
    if (g.guessed.length > pg.guessed.length && g.turn === pg.turn) sfx('uno');
    if (g.sub === 'reveal' && pg.sub !== 'reveal') sfx('pop');
  } else if (s.game === 'flip') {
    if (g.turn === s.me && pg.turn !== s.me && s.phase === 'play') sfx('turn');
    else if (g.top.id !== pg.top.id) sfx('card');
    if (g.flips > pg.flips) setTimeout(() => sfx('catch'), 150);
    if (g.hand.length > pg.hand.length) sfx('draw');
    const last = s.log[s.log.length - 1];
    if (last && last !== p.log[p.log.length - 1]) { if (last.includes('أونو!')) { sfx('unoCall'); unoBurst(last.split(':')[0]); } else if (last.includes('مسك')) sfx('penalty'); }
    if (s.phase === 'over' && p.phase === 'play') setTimeout(() => sfx('unoWin'), 400);
  } else if (s.game === 'outside') {
    if ((g.sub === 'ask' && g.asker === s.me && !(pg.sub === 'ask' && pg.asker === s.me)) || (g.sub === 'qa' && g.target === s.me && pg.target !== s.me)) sfx('turn');
    else if (g.sub === 'qa' && pg.sub !== 'qa') sfx('card');
    if (g.sub === 'vote' && pg.sub !== 'vote') sfx('uno');
    if (g.sub === 'guess' && pg.sub !== 'guess') sfx('catch');
  } else if (s.game === 'typing') {
    if (g.sub === 'go' && pg.sub !== 'go') sfx('uno');
    if (g.last && !pg.last) sfx(g.last.id === s.me ? 'win' : 'nope');
  } else if (s.game === 'hive') {
    if (g.cells.filter(c => c.o !== null).length > pg.cells.filter(c => c.o !== null).length) sfx('catch');
    else if (g.sub !== pg.sub && g.sub === 'steal') sfx('nope');
    else if (g.q && !pg.q) sfx('pop');
  }
  if (s.phase === 'over' && p.phase !== 'over' && !s.spec) {
    const m = me2(), won = s.game === 'mafia' ? !!(g.me && (g.win === 'j' ? g.jWin === s.me : g.win === (MROLE[g.me.role] || {}).team)) : s.game === 'outside' ? g.spyWins === (g.role === 'spy') : s.teams && s.winTeam != null ? m.tm === s.winTeam : s.winner === m.name;
    setTimeout(() => { sfx(won ? 'win' : 'lose'); if (won) confetti(); }, 400);
  }
}
function tick2() {
  if (!S || S.game === 'uno' || S.phase !== 'play') return;
  const r = S.left ? cd2() : '';
  $$('.cd2').forEach(e => e.textContent = r);
}
setInterval(tick2, 300);

// ---- الثيمات ----
const THEMES = [
  ['paper', 'ورق', '#f3ead8', '#e8362d'], ['night', 'ليل', '#17161d', '#ffc928'], ['sea', 'بحر', '#d6edf2', '#2a5bd7'],
  ['sunset', 'غروب', '#ffd9c2', '#e8362d'], ['mint', 'نعناع', '#d3f0da', '#1fa35c'], ['lilac', 'ليلكي', '#e4d9fb', '#7a4ee0'], ['rose', 'ورد', '#ffd6e6', '#e0407a'],
  ['coffee', 'قهوة', '#1d1611', '#d9893a'], ['sand', 'صحراء', '#efd9b0', '#c4561d']
];
function setTheme(id, save = true) {
  if (!THEMES.some(t => t[0] === id)) id = 'paper';
  if (id === 'paper') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = id;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
  const mt = document.querySelector('meta[name=theme-color]'); if (mt && bg) mt.content = bg;
  if (save) store.set('tarteeb-theme', id);
  $$('.sw').forEach(b => b.classList.toggle('on', b.dataset.t === id));
}
function themeBar(top) {
  let bar = $('#themeBar');
  if (!bar) {
    bar = document.createElement('div'); bar.id = 'themeBar'; bar.className = 'themebar'; bar.hidden = true;
    bar.innerHTML = THEMES.map(t => `<button class="sw" data-t="${t[0]}" style="--ac:${t[3]}"><i style="background:${t[2]}"></i>${t[1]}</button>`).join('');
    document.body.appendChild(bar);
    bar.querySelectorAll('.sw').forEach(b => b.onclick = () => { setTheme(b.dataset.t); sfx('pop'); });
    document.addEventListener('click', e => { if (!bar.hidden && !e.target.closest('#themeBar, .themebtn')) bar.hidden = true; });
  }
  bar.classList.toggle('top', !!top);
  bar.hidden = !bar.hidden;
  if (!top) bar.style.bottom = (innerHeight - $('#themeFab').getBoundingClientRect().top + 10) + 'px'; else bar.style.bottom = '';
  setTheme(store.get('tarteeb-theme') || 'paper', false);
}
$('#themeTop').onclick = () => themeBar(true);
$('#themeFab').onclick = () => themeBar(false);
setTheme(store.get('tarteeb-theme') || 'paper', false);


// ================= برا السالفة =================
const pn = id => { const p = S.players.find(x => x.id === id); return p ? (p.av ? p.av + ' ' : '') + p.name : '؟'; };
function renderOutside(body) {
  const g = S.g, over = S.phase === 'over', amAsker = g.sub === 'ask' && g.asker === S.me, amTarget = g.sub === 'qa' && g.target === S.me;
  const role = g.role === 'spy' ? `<div class="orole spy">🤫 أنت <b>برا السالفة</b> — ما تعرف الكلمة. اسمع الأسئلة والأجوبة وتظاهر إنك تعرف</div>`
    : g.role === 'in' ? `<div class="orole">الكلمة السرية: <b class="oword nt">${esc(g.word)}</b></div>` : '<div class="orole">أنت تتفرّج 👁</div>';
  const live = g.sub === 'ask' || g.sub === 'qa';
  const rows = S.players.map(p => {
    const cur = live && (g.asker === p.id || (g.sub === 'qa' && g.target === p.id));
    return `<div class="orow${cur ? ' cur' : ''}${over && g.spy === p.id ? ' spyrow' : ''}" data-id="${p.id}"><span class="on">${esc(pn(p.id))}</span><span class="ocl">${g.sub === 'qa' && g.asker === p.id ? '<i>يسأل</i>' : g.sub === 'qa' && g.target === p.id ? '<i>يجاوب</i>' : g.sub === 'ask' && g.asker === p.id ? '<i>دوره يسأل</i>' : ''}</span>${g.sub === 'vote' && g.voted.includes(p.id) ? '<b class="ok">✓</b>' : ''}${g.tally && g.tally[p.id] ? `<b class="vt">${g.tally[p.id]} 🗳</b>` : ''}</div>`;
  }).join('');
  let act = '';
  if (over) {
    act = `<div class="oreveal"><div>برا السالفة كان: <b>${esc(pn(g.spy))}</b></div><div>الكلمة: <b class="oword nt">${esc(g.word)}</b></div>${g.guess ? `<div>تخمينه: «${esc(g.guess)}»</div>` : ''}</div>`;
  } else if (g.sub === 'ask') {
    act = amAsker ? `<div class="vlabel">دورك! اختر مين تسأله <span class="muted">(اسأله بصوتك)</span></div><div class="vbtns">${g.canAsk.map(id => `<button type="button" class="vb ask" data-id="${id}">${esc(pn(id))}</button>`).join('')}</div>`
      : `<div class="muted">دور ${esc(pn(g.asker))} يختار مين يسأل…</div>`;
  } else if (g.sub === 'qa') {
    act = `<div class="qabox"><b>${esc(pn(g.asker))}</b> ← يسأل ← <b>${esc(pn(g.target))}</b></div>` + (amTarget ? `<div class="muted">جاوب بصوتك، وبعدها اضغط</div><button type="button" id="qaDone" class="btn green">جاوبت — دوري أسأل</button>` : `<div class="muted">اسمعوا السؤال والجواب… <span class="cd2"></span></div>`);
  } else if (g.sub === 'vote') {
    act = S.spec ? '<div class="muted">التصويت شغّال…</div>' : `<div class="vlabel">مين برا السالفة؟ ${g.myVote ? '' : '<span class="muted">اختر واحد</span>'}</div><div class="vbtns">${S.players.filter(p => p.id !== S.me).map(p => `<button type="button" class="vb${g.myVote === p.id ? ' on' : ''}" data-id="${p.id}">${esc(pn(p.id))}</button>`).join('')}</div>`;
  } else if (g.sub === 'guess') {
    act = g.role === 'spy' ? `<div class="vlabel">انكشفت! اختر الكلمة الصح وتفوز (الفئة: ${esc(g.cat)})</div><div class="vbtns wopts">${g.opts.map(w => `<button type="button" class="vb gw nt" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>`
      : `<div class="vlabel">انكشف <b>${esc(pn(g.accused))}</b> — ينتظر يخمّن الكلمة…</div>`;
  }
  const hostSkip = !over && !S.spec && live && S.players.find(p => p.h && p.id === S.me) && g.count >= S.players.length ? '<button type="button" id="toVote" class="btn sm">ابدأ التصويت الحين</button>' : '';
  const phaseTxt = over ? 'انتهت الجولة' : live ? `الأسئلة — ${Math.min(g.count + 1, g.total)} من ${g.total}` : g.sub === 'vote' ? 'وقت التصويت' : 'التخمين الأخير';
  const hist = g.hist.length && live ? `<div class="ohist">${g.hist.slice(-5).map(h => `<span>${esc(pn(h.from))} ← ${esc(pn(h.to))}</span>`).join('')}</div>` : '';
  body.innerHTML = `<div class="ocat"><span class="oc">الفئة: <b>${esc(g.cat)}</b></span><span class="ph">${phaseTxt} <span class="cd2"></span></span></div>${role}<div class="olist">${rows}</div>${hist}<div class="oact">${act}${hostSkip}</div>${logHtml()}`;
  body.querySelectorAll('.vb.ask').forEach(b => b.onclick = () => { send({ t: 'ask', id: b.dataset.id }); sfx('pop'); });
  body.querySelectorAll('.vb:not(.ask):not(.gw)').forEach(b => b.onclick = () => { send({ t: 'vote', id: b.dataset.id }); sfx('pop'); });
  body.querySelectorAll('.vb.gw').forEach(b => b.onclick = () => { send({ t: 'guess', text: b.dataset.w }); sfx('pop'); });
  const d = $('#qaDone'); if (d) d.onclick = () => send({ t: 'done' });
  const tv = $('#toVote'); if (tv) tv.onclick = () => { if (confirm(T('نبدأ التصويت الحين؟'))) send({ t: 'tovote' }); };
}

// ================= سبّاق الكتابة =================
const tyClean = t => String(t || '').replace(/[ً-ْـ]/g, '').replace(/\s+/g, ' ').trim();
let tySent = -1;
function renderTyping(body) {
  const g = S.g, over = S.phase === 'over', go = g.sub === 'go';
  const rows = [...S.players].sort((a, b) => (g.scores[b.id] || 0) - (g.scores[a.id] || 0)).map((p, i) => {
    const sc = g.scores[p.id] || 0;
    return `<div class="trow${p.id === S.me ? ' me' : ''}${g.last && g.last.id === p.id ? ' hit' : ''}" data-id="${p.id}"><span class="tn">${esc(pn(p.id))}</span><span class="tbar"><i style="width:${Math.min(100, sc / g.target * 100)}%"></i></span><b>${sc}/${g.target}</b></div>`;
  }).join('');
  let main;
  if (over) main = `<div class="tbox big">🏁 ${esc(S.winner)} وصل ${g.target} نقاط!</div>`;
  else if (g.sub === 'wait') main = `<div class="tbox big">استعد… <span class="cd2"></span></div><div class="muted">الجولة ${g.round} — النص بيظهر الحين</div>`;
  else if (go) main = `<div class="tbox"><div class="ttext nt">${esc(g.text)}</div></div>${S.spec ? '<div class="muted">تتفرّج 👁</div>' : `<input id="tyIn" class="tyin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="اكتب النص هنا…"><div class="muted">أسرع واحد يكتبه صح ياخذ النقطة <span class="cd2"></span></div>`}`;
  else main = `<div class="tbox big">${g.last ? `${esc(pn(g.last.id))} الأسرع! <small>${(g.last.ms / 1000).toFixed(1)} ث</small>` : 'ما أحد كتبها'}</div><div class="muted">الجولة الجاية بعد لحظات…</div>`;
  body.innerHTML = `<div class="ocat"><span class="oc">أول واحد يوصل <b>${g.target}</b> نقاط</span><span class="ph">الجولة ${g.round}</span></div><div class="tmain">${main}</div><div class="tlist">${rows}</div>${logHtml()}`;
  const inp = $('#tyIn');
  if (inp) {
    if (tySent !== g.round) setTimeout(() => inp.focus(), 30);
    const check = () => { if (tySent !== g.round && tyClean(inp.value) === tyClean(g.text)) { tySent = g.round; send({ t: 'type', text: inp.value }); } };
    inp.oninput = check; inp.onkeydown = e => { if (e.key === 'Enter') { send({ t: 'type', text: inp.value }); } };
  }
}

// ================= إعدادات الغرفة (اللوبي) =================
// سطر قصير يطلع تحت اسم اللعبة في بانر الغرفة
const LBLURB = { uno: 'نزّل أوراقك قبل الكل', codes: 'خمّن كلمات فريقك من تلميحة وحدة', hive: 'كوّن طريقك بالحروف قبل الخصم', liars: 'كذّب بثقة واكشف الكذاب', flip: 'أونو بوجهين، والورق ينقلب', chess: 'شطرنج كلاسيكي، الفايز يبقى', mimic: 'قلّد الصوت وخلهم يخمنون', auction: 'زايد على القطع واجمع أغلى مجموعة', jwb: 'جاوب مثل الأغلبية', feud: 'خمّن أشهر الأجوبة مع فريقك', flags: 'أعلام وعواصم، الأسرع يكسب', phone: 'اكتب وارسم والرسالة تتغير', fib: 'اكتب جواب كذب يصدقونه', bomb: 'كوّن كلمة قبل ما تنفجر', mafia: 'اكشف المافيا قبل ما تخلص المدينة', haunt: 'اهرب من البيت قبل ما يصيدك الشبح', sus: 'خلّص المهام واكشف المندس', outside: 'اعرف مين برا السالفة', typing: 'اكتب أسرع من الكل', jackaroo: 'وصّل كراتك البيت مع شريكك', draw: 'ارسم وخلهم يخمنون', baloot: 'بلوت سعودي أصلي', cars: 'طارد وصِد قبل ما يخلص الوقت', rich: 'اشترِ وابنِ وفلّس الباقين', boxing: 'ملاكمة ١ ضد ١، الفايز يبقى', brawl: 'اختر مقاتلك وادخل الساحة', tartayb: 'رتّب الحروف قبل الكل', redlight: 'اركض بالأخضر وثبّت بالأحمر', bwb: 'اكتب بالحرف واضغط ستوب', elim: 'جاوب صح أو اطلع', emo: 'المثل بالإيموجي… خمّنه', chairs: 'لما توقف الطقاقة… اقعد!', deal: 'كمّل مدنك قبل لا يسرقونها', qfl: 'احفظ أوراقك وقفّل قبلهم' };
const LBCOL = { uno: '#d8342b', codes: '#d6452f', hive: '#d99a1e', liars: '#7a4ee0', flip: '#c2367a', chess: '#7a5434', mimic: '#c93c78', auction: '#8a5a1c', jwb: '#0f8b8d', feud: '#1c3f8f', flags: '#2a5bd7', phone: '#13a3b5', fib: '#b8281f', bomb: '#c48a12', mafia: '#5b1b2a', haunt: '#3a2140', sus: '#2b3a8f', outside: '#1f8f52', typing: '#e0761a', jackaroo: '#1a8a4c', draw: '#2a5bd7', baloot: '#1d6b47', cars: '#3a3c43', rich: '#1fa35c', boxing: '#2b1f45', brawl: '#3b1e5c', tartayb: '#2f7a4a', redlight: '#7a2f5c', bwb: '#2f4a3a', elim: '#5b2a86', emo: '#1f8f52', chairs: '#b5563a', deal: '#8a1c1c', qfl: '#0f3d3a' };
let lsSig = '', lsOpen = false;
const GEMO = { uno: '🃏', codes: '🕵️', hive: '🐝', liars: '🤥', outside: '🕶️', typing: '🏁', jackaroo: '🎱', draw: '✏️', flip: '🔄', sus: '🚀', haunt: '👻', mafia: '🎩', phone: '☎️', fib: '🤫', bomb: '💣', auction: '🔨', feud: '👨‍👩‍👧', flags: '🌍', mimic: '🎙️', chess: '♞', jwb: '🗣️', baloot: '🂡', cars: '🚓', rich: '💰', boxing: '🥊', brawl: '⚔️', tartayb: '🔤', redlight: '🚦', bwb: '✏️', elim: '🎤', emo: '💬', chairs: '🪑', deal: '🏙️', qfl: '🔒' };
function renderLobbySet(isHost) {
  const gh = $('#ghelp'); if (gh) { gh.hidden = !S || S.spec; $('#ghelpTxt').textContent = GHELP[S.game] || ''; }
  const box = $('#lobbyset'); if (!S || S.spec) { box.hidden = true; return; }
  const o = S.opts || {}, hasBots = BOTGAMES.includes(S.game);
  const sig = JSON.stringify([isHost, S.game, o, S.players.length >= S.max]);
  box.hidden = false;
  if (sig === lsSig) return; lsSig = sig;
  const sum = [o.lock ? '🔒 مقفلة بدون متفرجين' : '', o.hasPass ? '🔑 بكلمة سر' : '', S.game === 'uno' && o.stack ? 'تراكم +٢/+٤' : '', S.game === 'uno' && o.powers ? '✨ بالقدرات' : '', S.game === 'uno' && o.turn !== 15 ? `مهلة الدور ${o.turn} ث` : '', S.game === 'sus' ? (o.map === 'forest' ? '🌲 الغابة الملعونة' : '🚀 السفينة') : '', S.game === 'sus' ? `${o.imps || 1} ${(o.imps || 1) > 1 ? 'مندسين' : 'مندس'}` : '', S.game === 'sus' && o.doctor ? 'طور الدكتور 🩺' : '', S.game === 'typing' ? `الهدف ${o.target} نقاط` : '', S.game === 'codes' && o.nwords ? `كلمات مخصصة (${o.nwords})` : ''].filter(Boolean);
  if (S.game === 'chess') sum.push({ none: 'بدون ساعة', '3+2': '⚡ ٣+٢', '5': '٥ دقايق', '10': '١٠ دقايق' }[o.ctime] || 'بدون ساعة', 'البوت ' + ({ easy: 'سهل', mid: 'متوسط', hard: 'صعب' }[o.clevel] || 'متوسط'));
  if (S.game === 'mimic') sum.push(`${o.mrounds || 5} جولات`, { all: 'كل الأصوات', react: '🎭 رياكشنات', basic: '🎵 منوّعة' }[o.mpack] || 'كل الأصوات');
  if (S.game === 'auction') sum.push(`${o.aitems || 8} قطع`); else if (S.game === 'feud') sum.push(`${o.drounds || 4} جولات`); else if (S.game === 'boxing') sum.push(`البطل يحتاج ${o.bwins || 2}`); else if (S.game === 'brawl') sum.push(`البطل يحتاج ${o.fwins || 2}`); else if (S.game === 'redlight') { sum.push(`${o.rtime || 60} ثانية للسباق`); } else if (S.game === 'bwb') { sum.push(`${o.brounds || 5} جولات`); sum.push(`${o.btime || 90} ثانية`); } else if (S.game === 'elim') { sum.push(`${(o.elives || 1) === 1 ? 'غلطة وحدة وتطلع' : (o.elives) + ' قلوب'}`); sum.push(`${o.etime || 15} ثانية للسؤال`); } else if (S.game === 'emo') { sum.push(`${o.erounds || 8} أمثال`); sum.push(`${o.emtime || 45} ثانية`); } else if (S.game === 'deal') { sum.push(`${o.dsets || 3} مدن للفوز`); sum.push(`${o.dtime || 60} ثانية للدور`); sum.push(`${o.dxbld ? 'بدون مباني' : 'ملحق وبرج'}`); sum.push(`${o.dxbig ? 'بدون الصفقة الكبرى' : 'الصفقة الكبرى'}`); } else if (S.game === 'qfl') { sum.push(`${o.qrounds || 5} جولات`); sum.push(`${o.qtime || 30} ثانية للدور`); } else if (S.game === 'tartayb') sum.push(`${o.trounds || 10} جولات`, `${o.ttime || 30} ثانية`); else if (S.game === 'rich') sum.push(o.mlim ? `${o.mlim} جولة` : 'لين يفلسون'); else if (S.game === 'cars') sum.push(`${o.krounds || 3} جولات`, `${o.ktime || 75} ثانية`); else if (S.game === 'jwb') sum.push(`${o.jrounds || 7} جولات`, `${o.jtime || 30} ثانية`, `${o.jn || 3} أجوبة`); else if (S.game === 'flags') sum.push({ flags: '🚩 أعلام', cap: '🏛️ عواصم', mix: '🌍 منوّع' }[o.fmode] || '🚩 أعلام', o.fdiff === 'all' ? 'كل الدول' : 'المشهورة', `${o.fcount || 10} سؤال`);
  if (S.game === 'bomb') sum.push('❤️'.repeat(o.blives || 3), { easy: 'سهل', mid: 'عادي', hard: 'صعب' }[o.bdiff] || 'عادي'); else if (S.game === 'fib') sum.push(`${o.frounds || 7} جولات`); else if (S.game === 'phone') sum.push(o.psteps ? `${o.psteps} خطوات` : 'تلف على الكل', `الرسم ${o.pdraw || 90} ث`);
  if (!isHost) { box.innerHTML = sum.length ? `<div class="lsum">${sum.map(x => `<span>${x}</span>`).join('')}</div>` : ''; box.hidden = !sum.length; return; }
  const gm = Object.keys(GNAME).map(k => `<button type="button" class="gsw${k === S.game ? ' on' : ''}" data-g="${k}"><i>${GEMO[k] || '🎲'}</i><span>${GNAME[k]}</span></button>`).join('');
  let extra = '';
  if (S.game === 'uno') extra = `<label class="chk"><input type="checkbox" id="oStack"${o.stack ? ' checked' : ''}> تراكم السحب (+٢ على +٢ و +٤ على +٤)</label>
    <label class="chk"><input type="checkbox" id="oPow"${o.powers ? ' checked' : ''}> ✨ أونو بالقدرات (تجسّس، سرقة، تبديل، تجميد، درع…)</label>
    <label class="chk">مهلة الدور <select id="oTurn">${[10, 15, 25, 40].map(n => `<option value="${n}"${o.turn === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>`;
  else if (S.game === 'sus') extra = `<label class="chk">الماب <select id="oMap"><option value="ship"${o.map !== 'forest' ? ' selected' : ''}>🚀 السفينة</option><option value="forest"${o.map === 'forest' ? ' selected' : ''}>🌲 الغابة الملعونة (رعب)</option></select></label>
    <label class="chk">عدد المندسين <select id="oImps">${[1, 2, 3].map(n => `<option value="${n}"${o.imps === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk"><input type="checkbox" id="oDoc"${o.doctor ? ' checked' : ''}> طور الدكتور 🩺 (يعطي درع لشخص كل جولة)</label><small class="muted">٢ مندسين يحتاج ٦ لاعبين، و٣ يحتاج ٩</small>`;
  else if (S.game === 'mafia') { const mr = o.mroles || {}, RN = { doc: '🩺 الطبيب', det: '🔍 المحقق', sniper: '🎯 القناص', god: '🎩 الأب الروحي', jester: '🃏 المهرج', mayor: '🎖️ العمدة' };
    extra = `<label class="chk">عدد المافيا <select id="oMc"><option value="0"${!o.mcount ? ' selected' : ''}>تلقائي</option>${[1, 2, 3, 4].map(n => `<option value="${n}"${o.mcount === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">وقت النقاش <select id="oDay">${[60, 90, 120, 180].map(n => `<option value="${n}"${o.dayT === n ? ' selected' : ''}>${n / 60 >= 1 && n % 60 === 0 ? n / 60 + ' دقيقة' : n + ' ثانية'}</option>`).join('')}</select></label>
    <label class="chk"><input type="checkbox" id="oRev"${o.reveal !== false ? ' checked' : ''}> يبان دور اللي يموت</label>
    <div class="mfroles">${Object.keys(RN).map(k => `<label class="chk"><input type="checkbox" data-mr="${k}"${mr[k] !== 0 ? ' checked' : ''}> ${RN[k]}</label>`).join('')}</div><small class="muted">الأدوار تدخل لما يكون العدد كافي: الطبيب ٤+، المحقق ٥+، القناص والأب الروحي والمهرج ٧+، العمدة ٨+</small>`; }
  else if (S.game === 'chess') extra = `<label class="chk">الساعة <select id="oCt">${[['none', 'بدون ساعة'], ['3+2', '⚡ ٣+٢'], ['5', '٥ دقايق'], ['10', '١٠ دقايق']].map(([k, n]) => `<option value="${k}"${o.ctime === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">البوت <select id="oCl">${[['easy', 'سهل'], ['mid', 'متوسط'], ['hard', 'صعب']].map(([k, n]) => `<option value="${k}"${o.clevel === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">الألوان <select id="oCc"><option value="rand"${o.ccolor !== 'host' ? ' selected' : ''}>عشوائي</option><option value="host"${o.ccolor === 'host' ? ' selected' : ''}>المضيف أبيض</option></select></label>`;
  else if (S.game === 'mimic') extra = `<label class="chk">الجولات <select id="oMr">${[5, 8, 10].map(n => `<option value="${n}"${o.mrounds === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">الأصوات <select id="oMp">${[['all', 'الكل'], ['react', '🎭 رياكشنات'], ['basic', '🎵 أصوات منوّعة']].map(([k, n]) => `<option value="${k}"${o.mpack === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
  else if (S.game === 'auction') extra = `<label class="chk">عدد القطع <select id="oAi">${[6, 8, 10].map(n => `<option value="${n}"${o.aitems === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
  else if (S.game === 'redlight') extra = `<label class="chk">وقت السباق <select id="oRlt">${[45, 60, 90].map(n => `<option value="${n}"${(o.rtime || 60) === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>`;
  else if (S.game === 'bwb') extra = `<label class="chk">عدد الجولات <select id="oBwr">${[3, 5, 8].map(n => `<option value="${n}"${(o.brounds || 5) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">وقت الجولة <select id="oBwt">${[60, 90, 120].map(n => `<option value="${n}"${(o.btime || 90) === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>`;
  else if (S.game === 'elim') extra = `<label class="chk">القلوب <select id="oElv">${[1, 2, 3].map(n => `<option value="${n}"${(o.elives || 1) === n ? ' selected' : ''}>${n === 1 ? 'غلطة وحدة وتطلع' : n + ' قلوب'}</option>`).join('')}</select></label>
    <label class="chk">وقت السؤال <select id="oElt">${[10, 15, 20].map(n => `<option value="${n}"${(o.etime || 15) === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>`;
  else if (S.game === 'emo') extra = `<label class="chk">عدد الأمثال <select id="oEmr">${[5, 8, 12].map(n => `<option value="${n}"${(o.erounds || 8) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">وقت المثل <select id="oEmt">${[30, 45, 60].map(n => `<option value="${n}"${(o.emtime || 45) === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>`;
  else if (S.game === 'deal') extra = `<label class="chk">مجموعات الفوز <select id="oDls">${[2, 3, 4].map(n => `<option value="${n}"${(o.dsets || 3) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">وقت الدور <select id="oDlt">${[30, 60, 90].map(n => `<option value="${n}"${(o.dtime || 60) === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>
    <label class="chk">الملحق والبرج <select id="oDlb">${[0, 1].map(n => `<option value="${n}"${(o.dxbld || 0) === n ? ' selected' : ''}>${n ? 'مطفية' : 'تشتغل'}</option>`).join('')}</select></label>
    <label class="chk">الصفقة الكبرى <select id="oDlg">${[0, 1].map(n => `<option value="${n}"${(o.dxbig || 0) === n ? ' selected' : ''}>${n ? 'مطفية' : 'تشتغل'}</option>`).join('')}</select></label>`;
  else if (S.game === 'qfl') extra = `<label class="chk">عدد الجولات <select id="oQfr">${[3, 5, 7].map(n => `<option value="${n}"${(o.qrounds || 5) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">وقت الدور <select id="oQft">${[20, 30, 45].map(n => `<option value="${n}"${(o.qtime || 30) === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>`;
  else if (S.game === 'tartayb') extra = `<label class="chk">عدد الجولات <select id="oTrr">${[5, 10, 15].map(n => `<option value="${n}"${(o.trounds || 10) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">وقت الجولة <select id="oTrt">${[20, 30, 45].map(n => `<option value="${n}"${(o.ttime || 30) === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>`;
  else if (S.game === 'brawl') extra = `<label class="chk">البطل يحتاج <select id="oFw">${[1, 2, 3].map(n => `<option value="${n}"${(o.fwins || 2) === n ? ' selected' : ''}>${n} ${n === 1 ? 'فوز' : 'انتصارات'}</option>`).join('')}</select></label>`;
  else if (S.game === 'boxing') extra = `<label class="chk">البطل يحتاج <select id="oBw">${[1, 2, 3].map(n => `<option value="${n}"${(o.bwins || 2) === n ? ' selected' : ''}>${n} ${n === 1 ? 'فوز' : 'انتصارات'}</option>`).join('')}</select></label>`;
  else if (S.game === 'rich') extra = `<label class="chk">تنتهي بعد <select id="oMl">${[[15, '١٥ جولة'], [25, '٢٥ جولة'], [0, 'لين يفلس الكل']].map(([n, l]) => `<option value="${n}"${(o.mlim == null ? 25 : o.mlim) === n ? ' selected' : ''}>${l}</option>`).join('')}</select></label>`;
  else if (S.game === 'cars') extra = `<label class="chk">عدد الجولات <select id="oKr">${[1, 3, 5].map(n => `<option value="${n}"${(o.krounds || 3) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">وقت الجولة <select id="oKt">${[60, 75, 90].map(n => `<option value="${n}"${(o.ktime || 75) === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>`;
  else if (S.game === 'jwb') extra = `<label class="chk">عدد الجولات <select id="oJr">${[5, 7, 10].map(n => `<option value="${n}"${(o.jrounds || 7) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">وقت الكتابة <select id="oJt">${[20, 30, 45].map(n => `<option value="${n}"${(o.jtime || 30) === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>
    <label class="chk">أجوبة كل لاعب <select id="oJn">${[1, 3, 5].map(n => `<option value="${n}"${(o.jn || 3) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
  else if (S.game === 'feud') extra = `<label class="chk">عدد الجولات <select id="oDr">${[4, 6].map(n => `<option value="${n}"${o.drounds === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
  else if (S.game === 'flags') extra = `<label class="chk">الأسئلة <select id="oFm">${[['flags', '🚩 أعلام'], ['cap', '🏛️ عواصم'], ['mix', '🌍 منوّع']].map(([k, n]) => `<option value="${k}"${o.fmode === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="chk">الدول <select id="oFd"><option value="easy"${o.fdiff !== 'all' ? ' selected' : ''}>المشهورة</option><option value="all"${o.fdiff === 'all' ? ' selected' : ''}>كل الدول (صعب)</option></select></label>
    <label class="chk">العدد <select id="oFc">${[10, 15, 20].map(n => `<option value="${n}"${o.fcount === n ? ' selected' : ''}>${n} سؤال</option>`).join('')}</select></label>`;
  else if (S.game === 'bomb') extra = `<label class="chk">القلوب <select id="oBl">${[2, 3, 4].map(n => `<option value="${n}"${o.blives === n ? ' selected' : ''}>${'❤️'.repeat(n)}</option>`).join('')}</select></label>
    <label class="chk">الصعوبة <select id="oBd">${[['easy', 'سهل'], ['mid', 'عادي'], ['hard', 'صعب']].map(([k, n]) => `<option value="${k}"${o.bdiff === k ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
  else if (S.game === 'fib') extra = `<label class="chk">عدد الجولات <select id="oFr">${[5, 7, 10].map(n => `<option value="${n}"${o.frounds === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>`;
  else if (S.game === 'phone') extra = `<label class="chk">طول المكالمة <select id="oPs">${[[0, 'كل اللاعبين'], [4, '٤ خطوات'], [6, '٦ خطوات'], [8, '٨ خطوات']].map(([n, t]) => `<option value="${n}"${o.psteps === n ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
    <label class="chk">وقت الرسم <select id="oPd">${[60, 90, 120].map(n => `<option value="${n}"${o.pdraw === n ? ' selected' : ''}>${n} ثانية</option>`).join('')}</select></label>`;
  else if (S.game === 'typing') extra = `<label class="chk">الهدف <select id="oTarget">${[3, 5, 8, 12].map(n => `<option value="${n}"${o.target === n ? ' selected' : ''}>${n} نقاط</option>`).join('')}</select></label>`;
  else if (S.game === 'codes') extra = `<details class="wdet"><summary>كلمات مخصصة ${o.nwords ? `(مفعّلة: ${o.nwords})` : '(اختياري)'}</summary><textarea id="oWords" rows="4" placeholder="اكتب ٢٥ كلمة أو أكثر، كل كلمة بسطر أو افصلها بفاصلة">${esc(o.wordsText || '')}</textarea><div class="row"><button type="button" id="oWordsSave" class="btn sm">حفظ الكلمات</button><button type="button" id="oWordsClear" class="btn sm">رجّع الكلمات العادية</button></div></details>`;
  box.innerHTML = `<section class="ls-sec ls-game${lsOpen ? ' open' : ''}">
      <div class="ls-cur"><span class="ls-ic">${GEMO[S.game] || '🎲'}</span><div><small>اللعبة</small><b>${GNAME[S.game]}</b><em>${GINFO[S.game] || ''}</em></div>
        <button type="button" id="lsToggle" class="btn sm" aria-expanded="${lsOpen}">${lsOpen ? 'خلاص ✓' : '🔄 غيّر اللعبة'}</button></div>
      <div class="ls-grid">${gm}</div></section>
    ${extra ? `<section class="ls-sec"><h4>⚙️ إعدادات اللعبة</h4><div class="ls-opts">${extra}</div></section>` : ''}
    <section class="ls-sec"><h4>🔐 الغرفة</h4><div class="ls-opts">
      <label class="chk"><input type="checkbox" id="oLock"${o.lock ? ' checked' : ''}> قفل الغرفة (بدون متفرجين)</label>
      <span class="passrow"><input id="oPass" maxlength="12" placeholder="كلمة سر (اختياري)" value="${esc(o.pass || '')}" autocomplete="off"><button type="button" id="oPassSave" class="btn sm">حفظ</button></span>
    </div></section>`;
  $('#lsToggle').onclick = () => { lsOpen = !lsOpen; lsSig = ''; renderLobbySet(isHost); };
  box.querySelectorAll('.gsw').forEach(b => b.onclick = () => { lsOpen = false; if (b.dataset.g !== S.game) send({ t: 'setgame', game: b.dataset.g }); else { lsSig = ''; renderLobbySet(isHost); } });
  const bind = (id, ev, fn) => { const e = $('#' + id); if (e) e[ev] = fn; };
  bind('oStack', 'onchange', e => send({ t: 'opt', k: 'stack', v: e.target.checked }));
  bind('oPow', 'onchange', e => send({ t: 'opt', k: 'powers', v: e.target.checked }));
  bind('oTurn', 'onchange', e => send({ t: 'opt', k: 'turn', v: +e.target.value }));
  bind('oMap', 'onchange', e => send({ t: 'opt', k: 'map', v: e.target.value }));
  bind('oImps', 'onchange', e => send({ t: 'opt', k: 'imps', v: +e.target.value }));
  bind('oDoc', 'onchange', e => send({ t: 'opt', k: 'doctor', v: e.target.checked }));
  bind('oTarget', 'onchange', e => send({ t: 'opt', k: 'target', v: +e.target.value }));
  bind('oMc', 'onchange', e => send({ t: 'opt', k: 'mcount', v: +e.target.value }));
  bind('oDay', 'onchange', e => send({ t: 'opt', k: 'dayT', v: +e.target.value }));
  bind('oRev', 'onchange', e => send({ t: 'opt', k: 'reveal', v: e.target.checked }));
  box.querySelectorAll('[data-mr]').forEach(c => c.onchange = () => send({ t: 'opt', k: 'mrole', r: c.dataset.mr, v: c.checked }));
  bind('oCt', 'onchange', e => send({ t: 'opt', k: 'ctime', v: e.target.value }));
  bind('oCl', 'onchange', e => send({ t: 'opt', k: 'clevel', v: e.target.value }));
  bind('oCc', 'onchange', e => send({ t: 'opt', k: 'ccolor', v: e.target.value }));
  bind('oMr', 'onchange', e => send({ t: 'opt', k: 'mrounds', v: +e.target.value }));
  bind('oMp', 'onchange', e => send({ t: 'opt', k: 'mpack', v: e.target.value }));
  bind('oAi', 'onchange', e => send({ t: 'opt', k: 'aitems', v: +e.target.value }));
  bind('oDr', 'onchange', e => send({ t: 'opt', k: 'drounds', v: +e.target.value }));
  bind('oBw', 'onchange', e => send({ t: 'opt', k: 'bwins', v: +e.target.value }));
  bind('oFw', 'onchange', e => send({ t: 'opt', k: 'fwins', v: +e.target.value }));
  bind('oTrr', 'onchange', e => send({ t: 'opt', k: 'trounds', v: +e.target.value }));
  bind('oTrt', 'onchange', e => send({ t: 'opt', k: 'ttime', v: +e.target.value }));
  bind('oQfr', 'onchange', e => send({ t: 'opt', k: 'qrounds', v: +e.target.value }));
  bind('oQft', 'onchange', e => send({ t: 'opt', k: 'qtime', v: +e.target.value }));
  bind('oDls', 'onchange', e => send({ t: 'opt', k: 'dsets', v: +e.target.value }));
  bind('oDlt', 'onchange', e => send({ t: 'opt', k: 'dtime', v: +e.target.value }));
  bind('oDlb', 'onchange', e => send({ t: 'opt', k: 'dxbld', v: +e.target.value }));
  bind('oDlg', 'onchange', e => send({ t: 'opt', k: 'dxbig', v: +e.target.value }));
  bind('oEmr', 'onchange', e => send({ t: 'opt', k: 'erounds', v: +e.target.value }));
  bind('oEmt', 'onchange', e => send({ t: 'opt', k: 'emtime', v: +e.target.value }));
  bind('oElv', 'onchange', e => send({ t: 'opt', k: 'elives', v: +e.target.value }));
  bind('oElt', 'onchange', e => send({ t: 'opt', k: 'etime', v: +e.target.value }));
  bind('oBwr', 'onchange', e => send({ t: 'opt', k: 'brounds', v: +e.target.value }));
  bind('oBwt', 'onchange', e => send({ t: 'opt', k: 'btime', v: +e.target.value }));
  bind('oRlt', 'onchange', e => send({ t: 'opt', k: 'rtime', v: +e.target.value }));
  bind('oMl', 'onchange', e => send({ t: 'opt', k: 'mlim', v: +e.target.value }));
  bind('oKr', 'onchange', e => send({ t: 'opt', k: 'krounds', v: +e.target.value }));
  bind('oKt', 'onchange', e => send({ t: 'opt', k: 'ktime', v: +e.target.value }));
  bind('oJr', 'onchange', e => send({ t: 'opt', k: 'jrounds', v: +e.target.value }));
  bind('oJt', 'onchange', e => send({ t: 'opt', k: 'jtime', v: +e.target.value }));
  bind('oJn', 'onchange', e => send({ t: 'opt', k: 'jn', v: +e.target.value }));
  bind('oFm', 'onchange', e => send({ t: 'opt', k: 'fmode', v: e.target.value }));
  bind('oFd', 'onchange', e => send({ t: 'opt', k: 'fdiff', v: e.target.value }));
  bind('oFc', 'onchange', e => send({ t: 'opt', k: 'fcount', v: +e.target.value }));
  bind('oBl', 'onchange', e => send({ t: 'opt', k: 'blives', v: +e.target.value }));
  bind('oBd', 'onchange', e => send({ t: 'opt', k: 'bdiff', v: e.target.value }));
  bind('oFr', 'onchange', e => send({ t: 'opt', k: 'frounds', v: +e.target.value }));
  bind('oPs', 'onchange', e => send({ t: 'opt', k: 'psteps', v: +e.target.value }));
  bind('oPd', 'onchange', e => send({ t: 'opt', k: 'pdraw', v: +e.target.value }));
  bind('oLock', 'onchange', e => send({ t: 'opt', k: 'lock', v: e.target.checked }));
  bind('oPassSave', 'onclick', () => { send({ t: 'opt', k: 'pass', v: $('#oPass').value }); toast($('#oPass').value.trim() ? 'انحفظت كلمة السر' : 'انشالت كلمة السر'); });
  bind('addBot', 'onclick', () => send({ t: 'addbot' }));
  bind('oWordsSave', 'onclick', () => send({ t: 'opt', k: 'words', v: $('#oWords').value }));
  bind('oWordsClear', 'onclick', () => { $('#oWords').value = ''; send({ t: 'opt', k: 'words', v: '' }); });
}

// ================= رسم وخمّن =================
const DCOL = ['#16130f', '#e8362d', '#2a5bd7', '#1fa35c', '#ffc928', '#8a4b2a', '#7a4ee0', '#fffaf0'], DW = [4, 8, 16, 30];
const DR = { strokes: [], ver: -1, n: 0, turn: undefined, color: 0, w: 1, cur: null, syncing: 0, ctx: null };
function dStroke(ctx, s, from = 0) {
  const pts = s.pts; if (!pts.length) return;
  ctx.strokeStyle = ctx.fillStyle = DCOL[s.c] || DCOL[0]; ctx.lineWidth = DW[s.w - 1] || 8; ctx.lineCap = ctx.lineJoin = 'round';
  if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], ctx.lineWidth / 2, 0, 7); ctx.fill(); return; }
  ctx.beginPath(); const a = Math.max(0, from - 1); ctx.moveTo(pts[a][0], pts[a][1]);
  for (let i = a + 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}
function dRedraw() {
  const cv = $('#dcv'); if (!cv) return; const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, 1000, 1000);
  DR.strokes.forEach(s => dStroke(ctx, s));
}
function drawNet(m) {
  if (m.t === 'strokes') { DR.strokes = m.list; DR.ver = m.ver; DR.n = m.n; DR.syncing = 0; dRedraw(); return; }
  let s = DR.strokes.find(x => x.id === m.id);
  if (!s) { s = { id: m.id, c: m.c, w: m.w, pts: [] }; DR.strokes.push(s); }
  const from = s.pts.length; s.pts.push(...m.pts); DR.n++;
  const cv = $('#dcv'); if (cv) dStroke(cv.getContext('2d'), s, from);
}
function dBuild(body) {
  body.dataset.built = 'draw';
  body.innerHTML = `<div class="dinfo" id="dInfo"></div><div id="dChoose" class="dchoose"></div>
    <div class="dwrap"><canvas id="dcv" width="1000" height="1000"></canvas></div>
    <div id="dTools" class="dtools"></div>
    <form id="dGuess" class="clueform"><input id="dIn" maxlength="30" placeholder="اكتب تخمينك…" autocomplete="off"><button class="btn green sm">خمّن</button></form>
    <div id="dFeed" class="dfeed"></div><div id="dScores" class="dscores"></div>`;
  const cv = $('#dcv'), ctx = cv.getContext('2d');
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 1000), Math.round((e.clientY - r.top) / r.height * 1000)]; };
  let buf = [], tm = null;
  const flush = () => { if (!DR.cur || !buf.length) return; send({ t: 'stroke', id: DR.cur.id, c: DR.cur.c, w: DR.cur.w, pts: buf.splice(0, 40) }); if (buf.length) flush(); };
  const canDraw = () => S && S.g && S.g.sub === 'draw' && S.g.drawer === S.me && !S.spec;
  cv.addEventListener('pointerdown', e => {
    if (!canDraw()) return; e.preventDefault(); cv.setPointerCapture(e.pointerId);
    const p = pt(e); DR.cur = { id: (Date.now() % 1e8) | 0, c: DR.color, w: DR.w + 1 === 0 ? 1 : DR.w, pts: [p] };
    DR.cur.w = DR.w + 1; DR.strokes.push(DR.cur); DR.n++; buf = [p]; dStroke(ctx, DR.cur); clearInterval(tm); tm = setInterval(flush, 70);
  });
  cv.addEventListener('pointermove', e => {
    if (!DR.cur) return; const p = pt(e), l = DR.cur.pts[DR.cur.pts.length - 1];
    if (Math.abs(p[0] - l[0]) + Math.abs(p[1] - l[1]) < 3) return;
    DR.cur.pts.push(p); buf.push(p); DR.n++; dStroke(ctx, DR.cur, DR.cur.pts.length - 1);
  });
  const up = () => { if (!DR.cur) return; clearInterval(tm); flush(); DR.cur = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  $('#dGuess').onsubmit = e => { e.preventDefault(); const t = $('#dIn').value.trim(); if (t) { send({ t: 'guess', text: t }); $('#dIn').value = ''; } };
  $('#dTools').onclick = e => {
    const b = e.target.closest('[data-c],[data-w],[data-a]'); if (!b) return;
    if (b.dataset.c) DR.color = +b.dataset.c; if (b.dataset.w) DR.w = +b.dataset.w;
    if (b.dataset.a === 'undo') { DR.strokes.pop(); dRedraw(); send({ t: 'undo' }); }
    if (b.dataset.a === 'clear') { DR.strokes = []; dRedraw(); send({ t: 'clear' }); }
    drawTools();
  };
  dRedraw();
}
function drawTools() {
  const el = $('#dTools'); if (!el) return;
  el.innerHTML = DCOL.map((c, i) => `<button type="button" class="dcol${DR.color === i ? ' on' : ''}" data-c="${i}" style="background:${c}" title="${i === 7 ? 'ممحاة' : 'لون'}">${i === 7 ? '⌫' : ''}</button>`).join('') +
    DW.map((w, i) => `<button type="button" class="dwd${DR.w === i ? ' on' : ''}" data-w="${i}"><i style="width:${6 + i * 5}px;height:${6 + i * 5}px"></i></button>`).join('') +
    '<button type="button" class="btn sm" data-a="undo">تراجع</button><button type="button" class="btn sm" data-a="clear">امسح</button>';
}
function renderDraw(body) {
  const g = S.g, isD = g.drawer === S.me && !S.spec, over = S.phase === 'over';
  if (body.dataset.built !== 'draw') dBuild(body);
  // مزامنة الرسم
  if (DR.turn === undefined || DR.turn !== g.turn) { const first = DR.turn === undefined; DR.turn = g.turn; if (!first) { DR.strokes = []; DR.ver = g.ver; DR.n = 0; dRedraw(); } }
  if (isD && g.sub === 'draw') { if (DR.ver !== g.ver) DR.ver = g.ver; }
  else if (g.ver !== DR.ver || g.n !== DR.n) { if (!DR.syncing || Date.now() - DR.syncing > 1500) { DR.syncing = Date.now(); send({ t: 'sync' }); } }
  const dn = pn(g.drawer);
  let info;
  if (over) info = '<b>انتهت اللعبة</b>';
  else if (g.sub === 'choose') info = isD ? 'اختر كلمة وارسمها:' : `${esc(dn)} يختار كلمة… <span class="cd2"></span>`;
  else if (g.sub === 'reveal') info = `الكلمة كانت: <b class="oword nt">${esc(g.word || '')}</b>`;
  else info = isD ? `ارسم: <b class="oword nt">${esc(g.word)}</b> <span class="cd2"></span>` : `${esc(dn)} يرسم — <b class="dhint nt">${esc(g.hint)}</b> <span class="cd2"></span>`;
  $('#dInfo').innerHTML = `<span class="muted">الدور ${g.turn} من ${g.turns}</span><div>${info}</div>`;
  // نبني أزرار الكلمات بس لما تتغير الخيارات — قبل كانت تنبني مع كل تحديث، فلو جا تحديث وسط الضغطة بالجوال تضيع الضغطة ويختار السيرفر كلمة ثانية بعد ما يخلص الوقت
  const dc = $('#dChoose'), ck = g.choices ? g.choices.join('|') : '';
  if (dc.dataset.k !== ck) {
    dc.dataset.k = ck; dc.dataset.sent = '';
    dc.innerHTML = g.choices ? g.choices.map(w => `<button type="button" class="vb nt" data-w="${esc(w)}">${esc(w)}</button>`).join('') : '';
    $$('#dChoose .vb').forEach(b => b.onclick = () => { if (dc.dataset.sent) return; dc.dataset.sent = '1'; b.classList.add('on'); $$('#dChoose .vb').forEach(x => x.disabled = true); send({ t: 'pickword', word: b.dataset.w }); });
  }
  const showTools = isD && g.sub === 'draw';
  $('#dTools').hidden = !showTools; if (showTools && !$('#dTools').children.length) drawTools();
  $('#dcv').classList.toggle('mine', showTools);
  const gf = $('#dGuess'); gf.hidden = isD || S.spec || g.sub !== 'draw';
  $('#dIn').disabled = g.done; $('#dIn').placeholder = g.done ? 'خمّنتها ✔ انتظر الباقي' : 'اكتب تخمينك…';
  $('#dFeed').innerHTML = [...g.guesses].slice(-6).map(x => `<div><b>${esc(pn(x.id))}:</b> <span class="nt">${esc(x.text)}</span></div>`).join('') + g.guessed.map(id => `<div class="gok">✔ ${esc(pn(id))} خمّن الكلمة</div>`).join('');
  $('#dScores').innerHTML = [...S.players].sort((a, b) => (g.scores[b.id] || 0) - (g.scores[a.id] || 0)).map(p => `<span class="pchip${p.id === g.drawer ? ' drw' : ''}" data-id="${p.id}">${p.id === g.drawer ? '✏️ ' : ''}${esc(pn(p.id))} <i>${g.scores[p.id] || 0}</i></span>`).join('');
}

// ================= جاكارو =================
const JCOL = ['#e8362d', '#2a5bd7', '#ff9f43', '#19b5c9'];
let jsel = null, jm = null;
const JDESC = { A: 'طلّع / ١ / ١١', K: 'طلّع / ١٣', Q: '١٢', J: 'بدّل', 4: 'رجوع ٤', 5: 'أي كرة ٥', 7: 'قسّمها', 10: '١٠ / احرق' };
function jlabel(k) {
  const t = k.split('|')[1];
  if (t === 'out') return 'طلّع كرة';
  if (t === 'b4') return 'رجوع ٤';
  if (t[0] === 'f') return '+' + t.slice(1);
  return t;
}
// ---- لوح الجاكارو: دائري مثل اللوح الحقيقي — ضلع مستقيم لكل لاعب (٧ خانات) وبين كل ضلعين «أذن» مايلة.
// كل لاعب يبدأ من رأس الأذن اللي يمينه، وبيته خط مايل داخل نفس الأذن، وقاعدته معيّن تحت ضلعه. وأنت دايم تحت.
const JB = { h: 29 }; JB.d = JB.h / Math.SQRT2; JB.R1 = 3 * JB.h + 4 * JB.d;
// خانة p (٠..١٩) من ربع اللاعب اللي تحت، بدون تدوير (المركز ٠،٠)
function jQuarter(p) {
  const { h, d, R1 } = JB, Bx = 3 * h + 5 * d, By = R1 + 5 * d;
  if (p <= 5) return [Bx - p * d, By - p * d];
  if (p <= 11) return [3 * h - (p - 5) * h, R1];
  if (p <= 16) return [-3 * h - (p - 11) * d, R1 + (p - 11) * d];
  return [-3 * h - 5 * d - (p - 16) * d, R1 + 5 * d - (p - 16) * d];
}
const jRot = (dx, dy, k) => { for (let i = 0; i < k; i++) [dx, dy] = [-dy, dx]; return [dx, dy]; };
const jCellXY = (cell, my) => { const rel = (cell - my * 20 + 80) % 80; return jRot(...jQuarter(rel % 20), Math.floor(rel / 20)); };
function jXY(s, p, k, my) {
  const q = (s - my + 4) % 4, { h, d, R1 } = JB;
  if (p < 0) { const o = .9 * h; return jRot([0, o, 0, -o][k], R1 + 2.45 * h + [-o, 0, o, 0][k], q); }
  if (p <= 79) return jCellXY((s * 20 + p) % 80, my);
  const k2 = p - 79, P = [3 * h + 7 * d, R1 + 3 * d]; // نص الأذن (خانة ٧٨)، ومنها يدخل البيت
  return jRot(P[0] - k2 * d, P[1] - k2 * d, q);
}
const jNum = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
function jMoveLabel(l, my) {
  if (l.burn != null) return `🔥 احرق ورقة على ${esc((S.players[l.burn] || {}).name || '')}`;
  const t = l.k.split('|')[1], who = S.players[l.s], mine = l.s === (S.g.ctl >= 0 ? S.g.ctl : my);
  const ball = `${mine ? '' : esc(who ? who.name : '') + ' '}كرة ${jNum(l.i + 1)}`;
  if (l.x) { const o = S.players[l.x[0]]; return `${ball} ⇄ ${esc(o ? o.name : '')}`; }
  if (t === 'out') return `${ball}: طلّعها`;
  if (t === 'b4') return `${ball}: رجوع ٤`;
  return `${ball}: +${jNum(t.slice(1))}${l.np >= 80 ? ' 🏠' : ''}${l.kill ? ' 💥' : ''}`;
}
function renderJack(body) {
  const g = S.g, over = S.phase === 'over', my = g.seat >= 0 ? g.seat : 0, mineTurn = g.turn === g.seat && !over && !S.spec;
  if (g.split) jsel = g.split.card;
  if (jsel !== null && !g.split && !g.hand.some(c => c.id === jsel)) { jsel = null; jm = null; }
  if (!mineTurn) { jsel = null; jm = null; }
  const legalAll = jsel === null ? [] : g.legal.filter(l => l.c === jsel), legal = legalAll.filter(l => l.burn == null), burnOpt = legalAll.find(l => l.burn != null);
  const byM = {}; legal.forEach(l => { (byM[l.s + '-' + l.i] = byM[l.s + '-' + l.i] || []).push(l); });
  const movers = Object.keys(byM);
  if (jm && !byM[jm]) jm = null;
  if (!jm && movers.length === 1 && byM[movers[0]].length > 1) jm = movers[0]; // كرة وحدة تقدر تتحرك: نختارها لك
  const mOpts = jm ? byM[jm] : [];
  const targets = new Set(mOpts.filter(l => l.x).map(l => l.x.join('-')));
  // الأشباح: وين بتروح الكرة. نعرضها للكرة المختارة، وللكرات اللي عندها خيار واحد بس
  const ghosts = [];
  movers.forEach(k => { const L = byM[k]; if (k === jm || (!jm && L.length === 1)) L.forEach(l => { if (!l.x) ghosts.push(l); }); });
  const xy = (s, p, k) => jXY(s, p, k, my);
  const f1 = n => n.toFixed(1);
  // المسار والخانات
  const { h: JH, d: JD, R1 } = JB;
  let cells = '';
  for (let c = 0; c < 80; c++) {
    const [x, y] = jCellXY(c, my), st = c % 20 === 0;
    cells += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${st ? 12.5 : 10.5}" class="jcell${st ? ' st' : ''}"${st ? ` style="stroke:${JCOL[c / 20]}"` : ''}/>`;
  }
  for (let s = 0; s < 4; s++) {
    for (let k = 80; k < 84; k++) { const [x, y] = xy(s, k, 0); cells += `<circle cx="${f1(x)}" cy="${f1(y)}" r="11.5" class="jlane" style="stroke:${JCOL[s]};fill:color-mix(in srgb,${JCOL[s]} 30%,#5a3517)"/>`; }
    for (let k = 0; k < 4; k++) { const [x, y] = xy(s, -1, k); cells += `<circle cx="${f1(x)}" cy="${f1(y)}" r="12" class="jbase" style="stroke:${JCOL[s]}"/>`; }
  }
  // الأشباح
  const gh = ghosts.map(l => {
    const [x, y] = xy(l.s, l.np, 0), t = l.k.split('|')[1];
    const lab = t === 'out' ? '⬆' : t === 'b4' ? '-٤' : '+' + jNum(t.slice(1));
    return `<g class="jgh${l.kill ? ' kill' : ''}" data-k="${esc(l.k)}" tabindex="0"><circle cx="${f1(x)}" cy="${f1(y)}" r="15"/><text x="${f1(x)}" y="${f1(y + 5)}">${l.kill ? '💥' : lab}</text></g>`;
  }).join('');
  // الكرات
  const ctlS = g.ctl >= 0 ? g.ctl : my;
  let marbles = '';
  for (let s = 0; s < 4; s++) g.marb[s].forEach((p, i) => {
    const [x, y] = xy(s, p, i), key = s + '-' + i, go = !!byM[key], tg = targets.has(key);
    const num = s === ctlS && !S.spec ? `<text x="${f1(x)}" y="${f1(y + 4.5)}" class="jmn">${jNum(i + 1)}</text>` : '';
    marbles += `<g class="jm${p === 0 ? ' grd' : ''}${go ? ' go' : ''}${tg ? ' tg' : ''}${jm === key ? ' sel' : ''}${g.last && g.last.cell && g.last.cell.s === s && g.last.cell.i === i ? ' lastm' : ''}" data-m="${key}"${go || tg ? ' tabindex="0"' : ''}><circle class="hit" cx="${f1(x)}" cy="${f1(y)}" r="17"/><circle class="ring" cx="${f1(x)}" cy="${f1(y)}" r="17"/><circle class="ball" cx="${f1(x)}" cy="${f1(y)}" r="12" fill="${JCOL[s]}"/><circle cx="${f1(x - 4)}" cy="${f1(y - 4.5)}" r="3.8" fill="#fff" opacity=".55"/>${num}${p === 0 ? `<text x="${f1(x + 11)}" y="${f1(y - 8)}" class="jshield">🛡</text>` : ''}</g>`;
  });
  // أسماء اللاعبين داخل المربع اللي بالنص (SVG بس — سفاري ما يرسم HTML داخل SVG صح)
  const cut = (t, n) => { const a = [...t]; return a.length > n ? a.slice(0, n - 1).join('') + '…' : t; };
  const lab = [0, 1, 2, 3].map(s => {
    const q = (s - my + 4) % 4, p = S.players[s], side = q % 2 === 1, cur = g.turn === s && !over;
    const tag = s === g.seat ? 'أنت' : g.seat >= 0 && s === (g.seat + 2) % 4 ? 'شريكك' : g.seat >= 0 ? 'خصم' : '';
    const nm = p ? p.name : '؟', av = p ? bmFace(p.id) : '؟', st = `🃏${jNum(g.cnt[s])}  🏠${jNum(g.home[s])}/٤`;
    const cls = `jlab${cur ? ' cur' : ''}`;
    if (!side) {
      const y = q === 0 ? R1 - 50 : -(R1 - 50), w = 196, hh = 50;
      return `<g class="${cls}"><rect x="${-w / 2}" y="${y - hh / 2}" width="${w}" height="${hh}" rx="14" style="stroke:${JCOL[s]}"/><circle cx="${w / 2 - 25}" cy="${y}" r="16" fill="${JCOL[s]}" class="jav"/><text x="${w / 2 - 25}" y="${y + 6}" class="javt">${esc(av)}</text><text x="${w / 2 - 50}" y="${y - 3}" class="jln e">${esc(cut(nm, 11))}</text><text x="${w / 2 - 50}" y="${y + 16}" class="jls e">${tag ? tag + ' · ' : ''}${st}</text></g>`;
    }
    const x = q === 1 ? -(R1 - 66) : R1 - 66, w = 100, hh = 84;
    return `<g class="${cls}"><rect x="${x - w / 2}" y="${-hh / 2}" width="${w}" height="${hh}" rx="14" style="stroke:${JCOL[s]}"/><circle cx="${x}" cy="-20" r="14" fill="${JCOL[s]}" class="jav"/><text x="${x}" y="-14.5" class="javt">${esc(av)}</text><text x="${x}" y="13" class="jln">${esc(cut(nm, 8))}</text><text x="${x}" y="32" class="jls">${tag ? tag + ' ' : ''}🃏${jNum(g.cnt[s])} 🏠${jNum(g.home[s])}</text></g>`;
  }).join('');
  // الوسط: آخر ورقة انلعبت
  const dc = g.discard, dred = dc && (dc.s === '♥' || dc.s === '♦');
  const bc = g.burned, bred = bc && (bc.s === '♥' || bc.s === '♦');
  const burnCard = bc ? `<g class="jdisc burnt${bred ? ' red' : ''}" transform="translate(44 8) rotate(12)"><rect x="-26" y="-36" width="52" height="72" rx="8"/><text x="0" y="-6" class="r">${bc.r}</text><text x="0" y="20" class="s">${bc.s}</text><text x="16" y="-24" class="fire">🔥</text></g>` : '';
  const centre = burnCard + (dc ? `<g class="jdisc${dred ? ' red' : ''}" transform="rotate(-7)"><rect x="-30" y="-42" width="60" height="84" rx="9"/><text x="0" y="-4" class="r">${dc.r}</text><text x="0" y="26" class="s">${dc.s}</text></g>` : `<g class="jdisc empty" transform="rotate(-7)"><rect x="-30" y="-42" width="60" height="84" rx="9"/></g>`);
  // اليد
  const hand = g.hand.map(c => {
    const has = g.legal.some(l => l.c === c.id), red = c.s === '♥' || c.s === '♦';
    return `<button type="button" class="jc${red ? ' red' : ''}${jsel === c.id ? ' sel' : ''}${mineTurn && has ? ' ok' : mineTurn ? ' dim' : ''}" data-id="${c.id}"${mineTurn && has ? '' : ' disabled'}><i class="tl">${c.r}<br>${c.s}</i><span>${c.s}</span><b>${c.r}</b><small>${JDESC[c.r] || c.r}</small></button>`;
  }).join('');
  let hint = '';
  if (over) hint = '';
  else if (S.spec) hint = 'تتفرّج 👁';
  else if (!mineTurn) hint = `دور ${esc((S.players[g.turn] || {}).name || '')}…`;
  else if (g.split) hint = `قسّمت الـ٧ — باقي <b>${jNum(g.split.left)}</b> خطوات`;
  else if (jsel === null) hint = 'دورك! اختر ورقة 👇';
  else if (jm && targets.size) hint = 'اختر الكرة اللي تبدّل معها ✨';
  else if (jm) hint = 'اختر وين تروح الكرة';
  else hint = 'اضغط الكرة المتوهّجة أو مكانها الجديد';
  const ctlNote = !S.spec && g.ctl >= 0 && g.ctl !== g.seat ? '<div class="jnote">خلّصت كراتك — تلعب بكرات شريكك 🤝</div>' : '';
  // أزرار الحركات: واضحة على الجوال وتشتغل بيد التحكم
  const list = (jm ? mOpts : legal.length <= 6 ? legal : []).concat(burnOpt && !jm ? [burnOpt] : []);
  const opts = jsel !== null && list.length ? `<div class="jopts">${list.map(l => `<button type="button" class="jmv${l.burn != null ? ' burn' : ''}" data-k="${esc(l.k)}" data-mk="${l.s}-${l.i}" style="--jc:${l.burn != null ? '#ff6a1a' : JCOL[l.s]}">${jMoveLabel(l, my)}</button>`).join('')}${jm && movers.length > 1 ? '<button type="button" class="jmv back" id="jBack">↩ كرة ثانية</button>' : ''}</div>` : '';
  const oldPos = window.JPOS || {};
  body.innerHTML = `<div class="jwrap">
    <div class="jtop"><span class="tc t0${g.turn % 2 === 0 && !over ? ' on' : ''}">فريق أ <b>${jNum(g.home[0] + g.home[2])}/٨</b></span><span class="jmidtop"><span class="cd2"></span><button type="button" class="jq" id="jHelpBtn" aria-label="شرح اللعبة">؟ الشرح</button></span><span class="tc t1${g.turn % 2 === 1 && !over ? ' on' : ''}"><b>${jNum(g.home[1] + g.home[3])}/٨</b> فريق ب</span></div>
    <svg class="jboard" viewBox="-356 -356 712 712"><defs><radialGradient id="jwood" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="#b98252"/><stop offset=".7" stop-color="#94603a"/><stop offset="1" stop-color="#6e4325"/></radialGradient></defs>
      <circle r="352" fill="#2e7d50" stroke="#16130f" stroke-width="5"/>
      <circle r="338" fill="url(#jwood)" stroke="#5a3517" stroke-width="4"/>
      <circle r="322" fill="none" stroke="rgba(60,30,10,.35)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
      <rect x="-${(R1 - 16).toFixed(0)}" y="-${(R1 - 16).toFixed(0)}" width="${(2 * R1 - 32).toFixed(0)}" height="${(2 * R1 - 32).toFixed(0)}" rx="26" class="jcen"/>
      ${cells}${lab}${centre}${gh}${marbles}</svg>
    <div class="jdock">${ctlNote}<div class="jhint${mineTurn ? ' me' : ''}">${hint}</div>${g.last ? `<div class="jlastl">${esc(((S.players[g.last.who] || {}).name || '') + ' ' + g.last.text)}</div>` : ''}${opts}
    <div class="jhand">${hand}</div></div>
    <div class="jhelpov" id="jHelp" hidden><div class="jhelpbox"><button type="button" class="jhx" id="jHelpX" aria-label="سكّر">✕</button><h3>شرح الجاكارو</h3><ul><li><b>الهدف:</b> أنت وشريكك (قبالتك) تدخلون الـ٨ كرات في البيت. لما تخلّص كراتك تلعبون بكرات شريكك.</li><li><b>التحكم:</b> اختر ورقة، بعدين اضغط الكرة المتوهّجة أو المكان اللي بتروح له (الدوائر الصفرا)، أو استخدم الأزرار تحت اللوح.</li><li><b>آص / شايب:</b> يطلّعون كرة من القاعدة. الآص يحرّك ١ أو ١١، والشايب ١٣.</li><li><b>بنت:</b> ١٢ خطوة. <b>ولد:</b> بدّل كرتك مع أي كرة ثانية على الطاولة.</li><li><b>٤:</b> رجوع ٤ خطوات. <b>٥:</b> حرّك أي كرة (حتى كرة خصمك) ٥ خطوات.</li><li><b>٧:</b> تقدر تقسّمها بين كراتك. باقي الأوراق تحرّك بعددها.</li><li><b>١٠:</b> يا تحرّك ١٠ خطوات، يا <b>تحرق</b> ورقة عشوائية على اللي بعدك ويروح عليه دوره 🔥</li><li><b>الحماية 🛡:</b> الكرة اللي واقفة على خانة بدايتها محمية: ما أحد يتخطاها ولا ينزل عليها ولا يبدّلها. وبالبيت ما تتخطى كراتك.</li><li><b>البيت:</b> تدخله من الخانة اللي بنص الأذن الملوّنة.</li><li>الكرة اللي تنزل عليها كرة غيرها <b>تنأكل</b> وترجع للقاعدة (حتى كرة شريكك!). ما تنزل على كرتك.</li><li>لو ما عندك حركة، أوراقك تنرمي وينتقل الدور.</li></ul></div></div></div>`;
  // حركة الكرات: تمشي خانة خانة على المسار بدل ما تطير
  const newPos = {};
  for (let s = 0; s < 4; s++) g.marb[s].forEach((p, i) => {
    const k = s + '-' + i, el = body.querySelector(`.jm[data-m="${k}"]`); if (!el) return;
    const [x, y] = xy(s, p, i); newPos[k] = { p, x, y };
    const o = oldPos[k]; if (!o || o.p === p) return;
    let pts;
    if (o.p >= 0 && p > o.p && p - o.p <= 16) { pts = [xy(s, o.p, i)]; for (let q = o.p, n = 0; q !== p && n < 16; n++) { q = q >= 80 ? q + 1 : q >= 78 && p >= 80 ? 80 : q + 1; pts.push(xy(s, q, i)); } }
    else if (p >= 0 && o.p > p && o.p - p <= 4) { pts = []; for (let q = o.p; q >= p; q--) pts.push(xy(s, q, i)); }
    else pts = [[o.x, o.y], [(o.x + x) / 2, (o.y + y) / 2 - 40], [x, y]];
    el.animate(pts.map(([px, py]) => ({ transform: `translate(${px - x}px,${py - y}px)` })), { duration: Math.min(1100, 120 * pts.length + 120), easing: 'ease-in-out' });
    try { const dur = Math.min(1100, 120 * pts.length + 120) / 1000, n = Math.min(10, pts.length - 1); for (let q = 1; q <= n; q++) sfx('marble', { at: dur * q / (n + 1), gain: q === n ? 1 : .55 }); if (p < 0 && o.p >= 0) setTimeout(() => sfx('catch'), 200); } catch {}
  });
  window.JPOS = newPos;
  const hov = $('#jHelp'); hov.hidden = !window.jHelpOpen;
  const setHelp = v => { window.jHelpOpen = v; hov.hidden = !v; };
  $('#jHelpBtn').onclick = () => setHelp(true); $('#jHelpX').onclick = () => setHelp(false); hov.onclick = e => { if (e.target === hov) setHelp(false); };
  const play = k => { if (!k) return; send({ t: 'move', id: jsel, key: k }); sfx('card'); jm = null; if (!g.split) jsel = null; };
  body.querySelectorAll('.jc').forEach(b => b.onclick = () => {
    if (g.split) return;
    const id = +b.dataset.id;
    if (jsel === id) { const L = g.legal.filter(l => l.c === id); if (L.length === 1) return play(L[0].k); jsel = null; jm = null; }
    else { jsel = id; jm = null; }
    sfx('shove'); renderJack(body);
  });
  body.querySelectorAll('.jmv[data-k]').forEach(b => {
    b.onclick = () => play(b.dataset.k);
    const hl = on => { const m = body.querySelector(`.jm[data-m="${b.dataset.mk}"]`); if (m) m.classList.toggle('hov', on); };
    b.onmouseenter = b.onfocus = () => hl(true); b.onmouseleave = b.onblur = () => hl(false);
  });
  const bk = $('#jBack'); if (bk) bk.onclick = () => { jm = null; renderJack(body); };
  body.querySelectorAll('.jgh').forEach(el => el.onclick = () => play(el.dataset.k));
  body.querySelectorAll('.jm').forEach(el => el.onclick = () => {
    const key = el.dataset.m;
    if (jm && targets.has(key)) { const l = mOpts.find(x => x.x && x.x.join('-') === key); if (l) play(l.k); return; }
    if (!mineTurn || jsel === null || !byM[key]) return;
    const L = byM[key];
    if (L.length === 1 && !L[0].x) return play(L[0].k);
    jm = jm === key && movers.length > 1 ? null : key; sfx('pop'); renderJack(body);
  });
}

// ================= أونو فليب =================
const FHEX = { red: '#e8362d', yellow: '#ffc928', green: '#1fa35c', blue: '#2a5bd7', pink: '#ef6fae', teal: '#18a7a0', orange: '#f28a1c', purple: '#7b3fc7', wild: '#16130f' };
const FAR = { red: 'أحمر', yellow: 'أصفر', green: 'أخضر', blue: 'أزرق', pink: 'وردي', teal: 'تركوازي', orange: 'برتقالي', purple: 'بنفسجي' };
const FSIDE = { L: ['red', 'yellow', 'green', 'blue'], D: ['pink', 'teal', 'orange', 'purple'] };
const FSYM = { draw1: '+1', draw5: '+5', reverse: '⇄', skip: '⊘', skipall: '⊗', flip: '⟳', wild: '✦', wd2: '+2', wdc: '🎨' };
const flipCard = (c, cls = '') => `<div class="fc ${cls}" style="--fc:${FHEX[c.c]}" data-id="${c.id}"><i>${FSYM[c.v] || c.v}</i><b>${FSYM[c.v] || c.v}</b><i class="r">${FSYM[c.v] || c.v}</i></div>`;
let flipPick = null;
function renderFlip(body) {
  const g = S.g, over = S.phase === 'over', dark = g.side === 'D', myTurn = !S.spec && g.turn === S.me && g.sub === 'play' && !over;
  const vic = g.chal && g.chal.victim === S.me;
  const rows = S.players.map(p => `<div class="frow${g.turn === p.id && !over ? ' cur' : ''}${g.winId === p.id ? ' win' : ''}" data-id="${p.id}"><span class="fn">${esc(pn(p.id))}</span>${g.called[p.id] && p.n <= 2 ? '<b class="fu">UNO</b>' : ''}<span class="fcnt">${over && g.points ? g.points[p.id] + ' نقطة' : p.n + ' 🂠'}</span>${g.catchable === p.id ? `<button type="button" class="catchb" data-id="${p.id}">امسكه!</button>` : ''}</div>`).join('');
  let mid = '';
  if (g.sub === 'chal' && g.chal && !over) {
    const k = g.chal.kind === 'wd2' ? '+٢ ملوّن' : 'ملوّن سحب لون';
    mid = vic ? `<div class="fchal"><b>${esc(pn(g.chal.by))}</b> لعب ${k} واختار <b style="color:${FHEX[g.chal.color]}">${FAR[g.chal.color]}</b><div class="muted">لو شكيت إنه عنده لون الطاولة تحدّاه</div><div class="fbtns"><button type="button" class="btn red sm" id="fcY">تحدّى</button><button type="button" class="btn green sm" id="fcN">اقبل</button></div></div>`
      : `<div class="muted">${esc(pn(g.chal.victim))} يقرر: يقبل ${k} أو يتحدّى…</div>`;
  } else if (over) mid = `<div class="fchal"><b>${esc(S.winner)}</b> فاز! 🎉<div class="muted">مجموع نقاط أوراق الباقين: ${g.total}</div></div>`;
  else mid = myTurn ? '<div class="vlabel">دورك — العب ورقة أو اسحب</div>' : `<div class="muted">دور ${esc(pn(g.turn))} <span class="cd2"></span></div>`;
  const hand = g.hand.map(c => flipCard(c, (c.ok ? 'ok' : myTurn ? 'no' : '') + (flipPick === c.id ? ' pick' : ''))).join('');
  const cols = flipPick != null ? `<div class="fcols">${FSIDE[g.side].map(c => `<button type="button" class="fcol" data-c="${c}" style="background:${FHEX[c]}">${FAR[c]}</button>`).join('')}</div>` : '';
  body.innerHTML = `<div class="fwrap${dark ? ' dark' : ''}">
    <div class="fbar"><span class="fside">${dark ? '🌙 الوجه الغامق' : '☀️ الوجه الفاتح'}</span><span class="fdir">${g.dir === 1 ? '↻' : '↺'}</span><span class="fcolr" style="background:${FHEX[g.color]}">${FAR[g.color] || ''}</span></div>
    <div class="flist">${rows}</div>
    <div class="ftable"><div class="fpile${myTurn ? ' can' : ''}" id="fDeck"><div class="fc back"><b>UNO</b></div><small>${g.deckN}</small></div>${flipCard(g.top, 'ftop')}</div>
    ${mid}${cols}
    <div class="fhand">${hand}</div>
    <div class="fact">${g.canUno ? '<button type="button" class="btn yellow" id="fUno">UNO!</button>' : ''}</div>
    ${logHtml()}</div>`;
  const fd = $('#fDeck'); if (fd) fd.onclick = () => { if (myTurn) { flipPick = null; send({ t: 'draw' }); } };
  body.querySelectorAll('.fc.ok').forEach(el => el.onclick = () => {
    const id = +el.dataset.id, c = g.hand.find(x => x.id === id);
    if (c.c === 'wild') { flipPick = flipPick === id ? null : id; renderFlip(body); return; }
    flipPick = null; send({ t: 'play', id }); sfx('pop');
  });
  body.querySelectorAll('.fcol').forEach(b => b.onclick = () => { const id = flipPick; flipPick = null; send({ t: 'play', id, color: b.dataset.c }); sfx('pop'); });
  const u = $('#fUno'); if (u) u.onclick = () => send({ t: 'uno' });
  body.querySelectorAll('.catchb').forEach(b => b.onclick = () => send({ t: 'catch' }));
  const y = $('#fcY'), n = $('#fcN'); if (y) y.onclick = () => send({ t: 'chal', yes: true }); if (n) n.onclick = () => send({ t: 'chal', yes: false });
}
