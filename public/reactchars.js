// شخصيات التفاعل (بدل الإيموجي): who = abu | umm | jad | hmd ، ex = laugh angry cry clap fire cool boom heart
function rcChar(who,ex,sz=96){
 const skin={abu:'#d9a57a',umm:'#e2b48a',jad:'#c99468',hmd:'#c98b5a'}[who], red=ex==='angry'?'#e0705a':skin;
 let back='',head='',hair='',face='',front='',beard='';
 // الخلفية للحالات
 if(ex==='fire')back=`<path d="M50 4 Q62 18 58 28 Q70 20 70 10 Q86 30 80 50 Q76 62 64 66 L36 66 Q22 60 20 46 Q16 30 30 18 Q30 30 38 32 Q34 16 50 4Z" fill="#ff7a2f" stroke="#3a2416" stroke-width="3"/>`;
 if(ex==='heart')back=[[18,20,.7],[82,24,.6],[78,60,.5]].map(([x,y,s])=>`<path transform="translate(${x},${y}) scale(${s})" d="M0 12 Q-14 2 -14 -6 Q-14 -14 -6 -14 Q-1 -14 0 -9 Q1 -14 6 -14 Q14 -14 14 -6 Q14 2 0 12Z" fill="#e0304a" stroke="#3a2416" stroke-width="3"/>`).join('');
 if(ex==='boom')back=`<path d="M14 30 L24 22 L22 10 L34 16 L42 4 L50 14 L60 2 L64 16 L78 10 L74 24 L88 28 L76 36Z" fill="#ffc928" stroke="#3a2416" stroke-width="3" stroke-linejoin="round"/>`;
 // الجسم
 const body=who==='umm'?'#7b3fc7':who==='jad'?'#e8e0cc':who==='hmd'?'#16130f':'#fffaf0';
 let out=`<path d="M18 100 Q20 76 50 74 Q80 76 82 100Z" fill="${body}" stroke="#3a2416" stroke-width="3"/>`;
 if(who==='hmd')out+=`<path d="M40 75 Q50 82 60 75" stroke="#3a3a3a" stroke-width="2.5" fill="none"/>`;else if(who!=='umm')out+=`<path d="M50 76 V100" stroke="#3a2416" stroke-width="2"/>`;
 head=`<ellipse cx="50" cy="50" rx="19" ry="21" fill="${red}" stroke="#3a2416" stroke-width="3"/>`;
 // غطاء الراس
 if(who==='abu'){hair=`<path d="M26 52 Q24 22 50 20 Q76 22 74 52 L82 80 Q72 66 70 46 Q50 36 30 46 Q28 66 18 80Z" fill="#fff" stroke="#3a2416" stroke-width="3" stroke-linejoin="round"/>${[[36,28],[46,25],[56,25],[64,30],[30,38],[70,40],[24,62],[76,62]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.3" fill="#c62828"/>`).join('')}<path d="M29 40 Q50 30 71 40" stroke="#16130f" stroke-width="5" fill="none"/><path d="M29 35 Q50 25 71 35" stroke="#16130f" stroke-width="4" fill="none"/>`;}
 if(who==='jad'){hair=`<path d="M26 52 Q24 22 50 20 Q76 22 74 52 L82 80 Q72 66 70 46 Q50 36 30 46 Q28 66 18 80Z" fill="#fffaf0" stroke="#3a2416" stroke-width="3" stroke-linejoin="round"/><path d="M29 40 Q50 30 71 40" stroke="#16130f" stroke-width="5" fill="none"/><path d="M29 35 Q50 25 71 35" stroke="#16130f" stroke-width="4" fill="none"/>`;front+=`<path d="M33 58 Q36 80 50 82 Q64 80 67 58 Q60 66 50 66 Q40 66 33 58Z" fill="#f3f0e6" stroke="#3a2416" stroke-width="2.5"/>`;}
 if(who==='hmd'){hair=`<path d="M30 46 Q26 22 44 20 Q48 14 56 18 Q66 16 70 26 Q76 34 70 48 Q68 36 60 34 Q50 30 40 34 Q32 36 30 46Z" fill="#16130f" stroke="#16130f" stroke-width="2"/>${[[34,26],[42,19],[52,16],[62,20],[68,28],[38,22]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.5" fill="#16130f"/>`).join('')}<ellipse cx="31" cy="52" rx="3.5" ry="5" fill="${skin}" stroke="#3a2416" stroke-width="2"/><ellipse cx="69" cy="52" rx="3.5" ry="5" fill="${skin}" stroke="#3a2416" stroke-width="2"/>`;beard=`<path d="M32 52 Q33 76 50 80 Q67 76 68 52 Q66 62 60 64 Q55 58 50 60 Q45 58 40 64 Q34 62 32 52Z" fill="#16130f"/><ellipse cx="50" cy="62" rx="8.5" ry="4.6" fill="#b5764a"/><path d="M38 59 Q42 53 50 55.5 Q58 53 62 59 Q57 57.5 50 58.5 Q43 57.5 38 59Z" fill="#16130f" stroke="#16130f" stroke-width="1.5" stroke-linejoin="round"/>`+(['clap','boom','heart','cool'].includes(ex)?`<path d="M37 43 q6 -4 11 -1 M52 42 q6 -3 11 1" stroke="#16130f" stroke-width="3.5" fill="none" stroke-linecap="round"/>`:'');}
 if(who==='umm'){hair=`<path d="M24 56 Q22 22 50 20 Q78 22 76 56 Q78 78 66 84 L34 84 Q22 78 24 56Z" fill="#c2185b" stroke="#3a2416" stroke-width="3"/>`;head=`<ellipse cx="50" cy="52" rx="17" ry="19" fill="${red}" stroke="#3a2416" stroke-width="3"/>`;front+=`<path d="M30 40 Q50 28 70 40" stroke="#a0124a" stroke-width="3" fill="none"/>`;}
 const ey=who==='umm'?50:49, my=who==='umm'?60:60;
 const E={
  laugh:`<path d="M40 ${ey} l5 -3 l-5 -3 M60 ${ey} l-5 -3 l5 -3" stroke="#3a2416" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M40 ${my-2} Q50 ${my+12} 60 ${my-2}Z" fill="#3a2416"/><path d="M32 52 q-3 5 0 8 M68 52 q3 5 0 8" stroke="#5fb7ff" stroke-width="3" fill="none"/>`,
  angry:`<path d="M38 ${ey-7} l9 4 M62 ${ey-7} l-9 4" stroke="#3a2416" stroke-width="3.5" stroke-linecap="round"/><circle cx="43" cy="${ey}" r="2.5" fill="#3a2416"/><circle cx="57" cy="${ey}" r="2.5" fill="#3a2416"/><path d="M42 ${my+4} Q50 ${my-2} 58 ${my+4}" stroke="#3a2416" stroke-width="3" fill="none"/>`,
  cry:`<path d="M38 ${ey} q5 -4 10 0 M52 ${ey} q5 -4 10 0" stroke="#3a2416" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M42 ${my+4} Q50 ${my-2} 58 ${my+4}" stroke="#3a2416" stroke-width="3" fill="none"/><path d="M41 ${ey+3} v20 M59 ${ey+3} v20" stroke="#5fb7ff" stroke-width="4" stroke-linecap="round"/>`,
  clap:`<circle cx="43" cy="${ey}" r="2.5" fill="#3a2416"/><circle cx="57" cy="${ey}" r="2.5" fill="#3a2416"/><path d="M42 ${my} Q50 ${my+8} 58 ${my}" stroke="#3a2416" stroke-width="3" fill="none"/>`,
  fire:`<path d="M38 ${ey-6} l8 3 M62 ${ey-6} l-8 3" stroke="#3a2416" stroke-width="3" stroke-linecap="round"/><circle cx="43" cy="${ey}" r="2.5" fill="#3a2416"/><circle cx="57" cy="${ey}" r="2.5" fill="#3a2416"/><path d="M42 ${my} Q50 ${my+6} 60 ${my-2}" stroke="#3a2416" stroke-width="3" fill="none"/>`,
  cool:`<path d="M32 ${ey-4} H68 L66 ${ey+3} Q62 ${ey+7} 56 ${ey+3} L54 ${ey-1} H46 L44 ${ey+3} Q38 ${ey+7} 34 ${ey+3}Z" fill="#16130f"/><path d="M43 ${my+1} Q51 ${my+6} 58 ${my-1}" stroke="#3a2416" stroke-width="3" fill="none"/>`,
  boom:`<circle cx="43" cy="${ey}" r="5" fill="#fff" stroke="#3a2416" stroke-width="2"/><circle cx="57" cy="${ey}" r="5" fill="#fff" stroke="#3a2416" stroke-width="2"/><circle cx="43" cy="${ey}" r="1.6" fill="#3a2416"/><circle cx="57" cy="${ey}" r="1.6" fill="#3a2416"/><ellipse cx="50" cy="${my+3}" rx="4" ry="5" fill="#3a2416"/>`,
  heart:`<path transform="translate(43,${ey}) scale(.32)" d="M0 12 Q-14 2 -14 -6 Q-14 -14 -6 -14 Q-1 -14 0 -9 Q1 -14 6 -14 Q14 -14 14 -6 Q14 2 0 12Z" fill="#e0304a"/><path transform="translate(57,${ey}) scale(.32)" d="M0 12 Q-14 2 -14 -6 Q-14 -14 -6 -14 Q-1 -14 0 -9 Q1 -14 6 -14 Q14 -14 14 -6 Q14 2 0 12Z" fill="#e0304a"/><path d="M42 ${my} Q50 ${my+8} 58 ${my}" stroke="#3a2416" stroke-width="3" fill="none"/>`};
 face=E[ex];
 if(ex==='clap')front+=`<g transform="translate(50,86)"><path d="M-14 6 L-18 -12 Q-18 -16 -14 -15 L-10 -2 L-12 -18 Q-11 -22 -7 -20 L-4 -4 L-2 -18 Q0 -21 3 -18 L3 4 Q0 12 -8 12Z" fill="${skin}" stroke="#3a2416" stroke-width="2.5"/><path d="M14 6 L18 -12 Q18 -16 14 -15 L10 -2 L12 -18 Q11 -22 7 -20 L4 -4" fill="${skin}" stroke="#3a2416" stroke-width="2.5"/></g><path d="M30 70 l-6 -4 M70 70 l6 -4 M50 64 v-4" stroke="#ffc928" stroke-width="3" stroke-linecap="round"/>`;
 if(ex==='angry')front+=`<path d="M22 22 q-4 -6 2 -10 M78 22 q4 -6 -2 -10" stroke="#9a9a9a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
 if(ex==='boom'&&who!=='umm')front+=`<path d="M30 14 Q50 4 70 14" stroke="#16130f" stroke-width="5" fill="none" transform="rotate(-8 50 10)"/>`;
 if(ex==='heart')front+=`<path d="M66 92 Q52 82 52 74 Q52 66 60 66 Q64 66 66 70 Q68 66 72 66 Q80 66 80 74 Q80 82 66 92Z" fill="#e0304a" stroke="#3a2416" stroke-width="2.5"/>`;
 const inner=`${back}${out}${hair}${head}${beard}${face}${front}`;
 return `<svg width="${sz}" height="${sz}" viewBox="0 0 100 100" aria-hidden="true">${who==='hmd'?`<g transform="translate(50 58) scale(1.25) translate(-50 -50)">${inner}</g>`:inner}</svg>`;
}
const RC_EXS=['laugh','angry','cry','clap','fire','cool','boom','heart'];
const RC_EXN={laugh:'هههه',angry:'معصّب',cry:'يبكي',clap:'كفو',fire:'ولّعت',cool:'رايق',boom:'انصدم',heart:'أحبكم'};

const RC_WHO = { abu: 'أبو ترتيب', umm: 'أم ترتيب', jad: 'جدّو', hmd: 'حميد' };
// نفس ترتيب EMOJIS بالسيرفر (البروتوكول ما تغير، بس الرسم)
const RC_EMO = { '😂': 'laugh', '😡': 'angry', '😭': 'cry', '👏': 'clap', '🔥': 'fire', '😎': 'cool', '🤯': 'boom', '❤️': 'heart' };
