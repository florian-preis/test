</div>
<!-- SETTINGS DRAWER -->
<div class="ov" id="ov"></div>
<div class="drawer" id="drawer">
  <div class="dpull"></div>
  <div class="dhd"><span class="dhd-t">Settings</span><button class="dx" id="dx">✕</button></div>
  <div class="ds"><div class="ds-l">Regions</div>
    <div class="cr c2">
      <div class="chip on" data-g="region" data-v="europe">Europe</div>
      <div class="chip on" data-g="region" data-v="asia">Asia</div>
      <div class="chip on" data-g="region" data-v="africa">Africa</div>
      <div class="chip on" data-g="region" data-v="americas">Americas</div>
    </div>
  </div>
  <div class="ddiv"></div>
  <div class="ds" style="margin-top:20px"><div class="ds-l">Difficulty</div>
    <div class="cr c3">
      <div class="chip" data-g="diff" data-v="easy">Easy</div>
      <div class="chip on" data-g="diff" data-v="medium">Medium</div>
      <div class="chip" data-g="diff" data-v="hard">Hard</div>
    </div>
  </div>
  <div class="ddiv"></div>
  <div class="ds" style="margin-top:20px"><div class="ds-l">Answer Style</div>
    <div class="cr c2">
      <div class="chip on" data-g="style" data-v="mc">Multiple choice</div>
      <div class="chip" data-g="style" data-v="type">Type in</div>
    </div>
  </div>
  <div class="ddiv"></div>
  <div class="ds" style="margin-top:20px"><div class="ds-l">Game Mode</div>
    <div class="cr c2">
      <div class="chip on" data-g="mode" data-v="rounds">Rounds of 10</div>
      <div class="chip" data-g="mode" data-v="marathon">Marathon</div>
    </div>
  </div>
  <div class="ddiv"></div>
  <div class="ds" style="margin-top:20px"><div class="ds-l">Display</div>
    <div class="night-row">
      <span style="font-size:13px;color:var(--ink)">Night mode</span>
      <label class="nt"><input type="checkbox" id="night-toggle"><span class="nt-sl"></span></label>
    </div>
  </div>
  <div class="dact"><button class="dsave" id="dsave">Save settings</button></div>
</div>
<script>
// ─── COUNTRY DATA ────────────────────────────────────────────────────
// Flag URLs use flagcdn.com (reliable, works locally & online)
function flagUrl(id,size=64){return`https://flagcdn.com/w${size}/${id}.png`;}

// Confusable cities pool for capitals mode distractors
// Per-country commonly confused cities (assumed capital → real capital traps)
const CONFUSABLE_CITIES={
  au:['Sydney','Melbourne'],be:['Antwerp','Bruges','Ghent'],bz:['Belize City'],
  bj:['Cotonou'],bo:['La Paz'],br:['Rio de Janeiro','São Paulo'],bi:['Bujumbura'],
  cm:['Douala'],ca:['Toronto','Montreal','Vancouver'],cn:['Shanghai','Beijing','Guangzhou'],
  ci:['Abidjan'],ec:['Guayaquil'],gq:['Malabo'],in:['Mumbai','Kolkata','Bangalore'],
  id:['Bali','Denpasar','Surabaya'],il:['Tel Aviv'],kz:['Almaty'],my:['Putrajaya'],
  ma:['Casablanca','Marrakech'],mm:['Yangon'],nl:['The Hague','Rotterdam'],
  nz:['Auckland'],ng:['Lagos'],pk:['Karachi','Lahore'],ph:['Quezon City','Cebu'],
  sa:['Jeddah','Mecca'],za:['Johannesburg','Cape Town','Durban'],lk:['Colombo'],
  ch:['Zurich','Geneva'],tz:['Dar es Salaam'],th:['Phuket','Chiang Mai'],
  tr:['Istanbul','Izmir'],ae:['Dubai','Sharjah'],us:['New York','Los Angeles','Chicago'],
  vn:['Ho Chi Minh City','Da Nang'],nl:['The Hague','Amsterdam'],
  de:['Munich','Hamburg','Frankfurt'],it:['Milan','Naples','Florence'],
  es:['Barcelona','Seville','Valencia'],ru:['St Petersburg','Novosibirsk'],
  gb:['Manchester','Birmingham','Edinburgh'],fr:['Lyon','Marseille','Nice'],
  jp:['Osaka','Kyoto','Yokohama'],kr:['Busan','Incheon'],
  eg:['Alexandria','Luxor'],ke:['Mombasa'],tz:['Dar es Salaam'],
  ar:['Buenos Aires','Córdoba','Rosario'],mx:['Guadalajara','Monterrey'],
  co:['Medellín','Cali','Cartagena'],pe:['Cusco','Arequipa'],
  ng:['Lagos','Kano','Ibadan'],gh:['Kumasi'],sn:['Dakar'],
  ir:['Isfahan','Shiraz','Tabriz'],iq:['Basra','Mosul'],
  ua:['Kharkiv','Lviv','Odesa'],pl:['Kraków','Gdańsk','Wrocław'],
};

// Smart capital distractors: use per-country confusable cities when available
function getCapDist(country,pool){
  const base=getDist(country,pool);
  const confused=CONFUSABLE_CITIES[country.id];
  if(!confused||!confused.length) return base;

  // Always inject at least one confusable city as a distractor
  // Chance increases with difficulty: easy=30%, medium=60%, hard=100%
  const chance={easy:.3,medium:.6,hard:1}[S.diff]||.6;
  if(Math.random()>chance) return base;

  const city=confused[Math.floor(Math.random()*confused.length)];
  // Replace one distractor with the confusable city, keeping the others as real caps
  const result=[...base];
  result[Math.floor(Math.random()*result.length)]={id:'_trap',name:'_',cap:city,flag:''};
  return result;
}const C=[
  {id:'gb',name:'United Kingdom',cap:'London',r:'europe',d:'easy',x:['ie','fr','nl']},
  {id:'fr',name:'France',cap:'Paris',r:'europe',d:'easy',x:['be','nl','lu']},
  {id:'de',name:'Germany',cap:'Berlin',r:'europe',d:'easy',x:['at','ch','nl']},
  {id:'it',name:'Italy',cap:'Rome',r:'europe',d:'easy',x:['mt','sm','hr']},
  {id:'es',name:'Spain',cap:'Madrid',r:'europe',d:'easy',x:['pt','fr','ad']},
  {id:'nl',name:'Netherlands',cap:'Amsterdam',r:'europe',d:'easy',x:['be','lu','de']},
  {id:'be',name:'Belgium',cap:'Brussels',r:'europe',d:'medium',x:['nl','lu','fr']},
  {id:'at',name:'Austria',cap:'Vienna',r:'europe',d:'medium',x:['de','ch','hu']},
  {id:'ch',name:'Switzerland',cap:'Bern',r:'europe',d:'medium',x:['at','de','li']},
  {id:'se',name:'Sweden',cap:'Stockholm',r:'europe',d:'easy',x:['no','fi','dk']},
  {id:'no',name:'Norway',cap:'Oslo',r:'europe',d:'easy',x:['se','fi','dk']},
  {id:'dk',name:'Denmark',cap:'Copenhagen',r:'europe',d:'easy',x:['se','no','de']},
  {id:'fi',name:'Finland',cap:'Helsinki',r:'europe',d:'medium',x:['se','no','ee']},
  {id:'pl',name:'Poland',cap:'Warsaw',r:'europe',d:'medium',x:['cz','sk','by']},
  {id:'pt',name:'Portugal',cap:'Lisbon',r:'europe',d:'medium',x:['es','br','ao']},
  {id:'gr',name:'Greece',cap:'Athens',r:'europe',d:'medium',x:['cy','mk','al']},
  {id:'hu',name:'Hungary',cap:'Budapest',r:'europe',d:'medium',x:['at','sk','ro']},
  {id:'ro',name:'Romania',cap:'Bucharest',r:'europe',d:'medium',x:['md','bg','hu']},
  {id:'ru',name:'Russia',cap:'Moscow',r:'europe',d:'easy',x:['by','ua','kz']},
  {id:'ua',name:'Ukraine',cap:'Kyiv',r:'europe',d:'medium',x:['ru','by','md']},
  {id:'hr',name:'Croatia',cap:'Zagreb',r:'europe',d:'hard',x:['si','ba','rs']},
  {id:'sk',name:'Slovakia',cap:'Bratislava',r:'europe',d:'hard',x:['cz','pl','hu']},
  {id:'si',name:'Slovenia',cap:'Ljubljana',r:'europe',d:'hard',x:['hr','at','hu']},
  {id:'rs',name:'Serbia',cap:'Belgrade',r:'europe',d:'hard',x:['hr','ba','mk']},
  {id:'al',name:'Albania',cap:'Tirana',r:'europe',d:'hard',x:['me','mk','gr']},
  {id:'lv',name:'Latvia',cap:'Riga',r:'europe',d:'hard',x:['lt','ee','by']},
  {id:'lt',name:'Lithuania',cap:'Vilnius',r:'europe',d:'hard',x:['lv','by','pl']},
  {id:'ee',name:'Estonia',cap:'Tallinn',r:'europe',d:'hard',x:['lv','fi','ru']},
  {id:'lu',name:'Luxembourg',cap:'Luxembourg City',r:'europe',d:'hard',x:['be','fr','de']},
  {id:'ie',name:'Ireland',cap:'Dublin',r:'europe',d:'medium',x:['gb','is','no']},
  {id:'is',name:'Iceland',cap:'Reykjavik',r:'europe',d:'hard',x:['no','gb','ie']},
  {id:'by',name:'Belarus',cap:'Minsk',r:'europe',d:'hard',x:['pl','ru','ua']},
  {id:'me',name:'Montenegro',cap:'Podgorica',r:'europe',d:'hard',x:['rs','al','ba']},
  {id:'md',name:'Moldova',cap:'Chișinău',r:'europe',d:'hard',x:['ro','ua','by']},
  {id:'mk',name:'N. Macedonia',cap:'Skopje',r:'europe',d:'hard',x:['gr','al','rs']},
  {id:'ba',name:'Bosnia & Herzegovina',cap:'Sarajevo',r:'europe',d:'hard',x:['hr','rs','me']},
  {id:'bg',name:'Bulgaria',cap:'Sofia',r:'europe',d:'medium',x:['ro','gr','rs']},
  {id:'cn',name:'China',cap:'Beijing',r:'asia',d:'easy',x:['mn','kp','vn']},
  {id:'jp',name:'Japan',cap:'Tokyo',r:'asia',d:'easy',x:['kr','cn','tw']},
  {id:'in',name:'India',cap:'New Delhi',r:'asia',d:'easy',x:['pk','bd','lk']},
  {id:'id',name:'Indonesia',cap:'Jakarta',r:'asia',d:'easy',x:['my','ph','tl']},
  {id:'pk',name:'Pakistan',cap:'Islamabad',r:'asia',d:'medium',x:['af','in','ir']},
  {id:'bd',name:'Bangladesh',cap:'Dhaka',r:'asia',d:'medium',x:['in','mm','np']},
  {id:'th',name:'Thailand',cap:'Bangkok',r:'asia',d:'medium',x:['mm','kh','la']},
  {id:'vn',name:'Vietnam',cap:'Hanoi',r:'asia',d:'medium',x:['cn','kh','la']},
  {id:'ph',name:'Philippines',cap:'Manila',r:'asia',d:'medium',x:['id','my','tl']},
  {id:'my',name:'Malaysia',cap:'Kuala Lumpur',r:'asia',d:'medium',x:['id','sg','bn']},
  {id:'kr',name:'South Korea',cap:'Seoul',r:'asia',d:'easy',x:['kp','jp','cn']},
  {id:'kp',name:'North Korea',cap:'Pyongyang',r:'asia',d:'hard',x:['kr','cn','ru']},
  {id:'tw',name:'Taiwan',cap:'Taipei',r:'asia',d:'medium',x:['cn','jp','ph']},
  {id:'np',name:'Nepal',cap:'Kathmandu',r:'asia',d:'hard',x:['in','bt','bd']},
  {id:'bt',name:'Bhutan',cap:'Thimphu',r:'asia',d:'hard',x:['in','cn','np']},
  {id:'lk',name:'Sri Lanka',cap:'Colombo',r:'asia',d:'hard',x:['in','mv','bd']},
  {id:'af',name:'Afghanistan',cap:'Kabul',r:'asia',d:'medium',x:['ir','pk','tj']},
  {id:'ir',name:'Iran',cap:'Tehran',r:'asia',d:'medium',x:['iq','af','az']},
  {id:'iq',name:'Iraq',cap:'Baghdad',r:'asia',d:'medium',x:['ir','sy','jo']},
  {id:'sy',name:'Syria',cap:'Damascus',r:'asia',d:'hard',x:['lb','jo','iq']},
  {id:'il',name:'Israel',cap:'Jerusalem',r:'asia',d:'medium',x:['jo','lb','ps']},
  {id:'jo',name:'Jordan',cap:'Amman',r:'asia',d:'hard',x:['sa','iq','sy']},
  {id:'lb',name:'Lebanon',cap:'Beirut',r:'asia',d:'hard',x:['sy','il','jo']},
  {id:'sa',name:'Saudi Arabia',cap:'Riyadh',r:'asia',d:'easy',x:['ae','kw','om']},
  {id:'ae',name:'UAE',cap:'Abu Dhabi',r:'asia',d:'medium',x:['qa','bh','om']},
  {id:'kw',name:'Kuwait',cap:'Kuwait City',r:'asia',d:'hard',x:['sa','iq','bh']},
  {id:'qa',name:'Qatar',cap:'Doha',r:'asia',d:'medium',x:['bh','ae','kw']},
  {id:'ye',name:'Yemen',cap:"Sana'a",r:'asia',d:'hard',x:['om','sa','er']},
  {id:'om',name:'Oman',cap:'Muscat',r:'asia',d:'hard',x:['ae','sa','ye']},
  {id:'kz',name:'Kazakhstan',cap:'Astana',r:'asia',d:'hard',x:['uz','kg','tm']},
  {id:'uz',name:'Uzbekistan',cap:'Tashkent',r:'asia',d:'hard',x:['kz','tm','tj']},
  {id:'az',name:'Azerbaijan',cap:'Baku',r:'asia',d:'hard',x:['ge','am','ir']},
  {id:'ge',name:'Georgia',cap:'Tbilisi',r:'asia',d:'hard',x:['am','az','tr']},
  {id:'am',name:'Armenia',cap:'Yerevan',r:'asia',d:'hard',x:['az','ge','tr']},
  {id:'mm',name:'Myanmar',cap:'Naypyidaw',r:'asia',d:'hard',x:['th','la','bd']},
  {id:'kh',name:'Cambodia',cap:'Phnom Penh',r:'asia',d:'hard',x:['th','vn','la']},
  {id:'la',name:'Laos',cap:'Vientiane',r:'asia',d:'hard',x:['th','vn','cn']},
  {id:'sg',name:'Singapore',cap:'Singapore',r:'asia',d:'medium',x:['my','id','bn']},
  {id:'tr',name:'Turkey',cap:'Ankara',r:'asia',d:'medium',x:['sy','ir','gr']},
  {id:'mn',name:'Mongolia',cap:'Ulaanbaatar',r:'asia',d:'hard',x:['cn','ru','kz']},
  {id:'ng',name:'Nigeria',cap:'Abuja',r:'africa',d:'easy',x:['gh','cm','bj']},
  {id:'et',name:'Ethiopia',cap:'Addis Ababa',r:'africa',d:'easy',x:['ke','so','er']},
  {id:'za',name:'South Africa',cap:'Pretoria',r:'africa',d:'easy',x:['zw','bw','na']},
  {id:'ke',name:'Kenya',cap:'Nairobi',r:'africa',d:'easy',x:['tz','ug','et']},
  {id:'tz',name:'Tanzania',cap:'Dodoma',r:'africa',d:'medium',x:['ke','mz','zm']},
  {id:'ug',name:'Uganda',cap:'Kampala',r:'africa',d:'medium',x:['ke','rw','cd']},
  {id:'gh',name:'Ghana',cap:'Accra',r:'africa',d:'medium',x:['ci','tg','bj']},
  {id:'eg',name:'Egypt',cap:'Cairo',r:'africa',d:'easy',x:['ly','sd','il']},
  {id:'dz',name:'Algeria',cap:'Algiers',r:'africa',d:'medium',x:['ma','tn','ly']},
  {id:'ma',name:'Morocco',cap:'Rabat',r:'africa',d:'medium',x:['dz','mr','es']},
  {id:'tn',name:'Tunisia',cap:'Tunis',r:'africa',d:'medium',x:['dz','ly','ma']},
  {id:'ly',name:'Libya',cap:'Tripoli',r:'africa',d:'medium',x:['dz','tn','eg']},
  {id:'sd',name:'Sudan',cap:'Khartoum',r:'africa',d:'medium',x:['eg','ly','et']},
  {id:'cm',name:'Cameroon',cap:'Yaoundé',r:'africa',d:'hard',x:['ng','cg','cf']},
  {id:'cd',name:'DR Congo',cap:'Kinshasa',r:'africa',d:'hard',x:['cg','ao','zm']},
  {id:'cg',name:'Rep. of Congo',cap:'Brazzaville',r:'africa',d:'hard',x:['cd','cm','ga']},
  {id:'ao',name:'Angola',cap:'Luanda',r:'africa',d:'hard',x:['cd','zm','na']},
  {id:'mz',name:'Mozambique',cap:'Maputo',r:'africa',d:'hard',x:['tz','zm','zw']},
  {id:'zm',name:'Zambia',cap:'Lusaka',r:'africa',d:'hard',x:['zw','mz','cd']},
  {id:'zw',name:'Zimbabwe',cap:'Harare',r:'africa',d:'hard',x:['za','mz','zm']},
  {id:'ci',name:'Ivory Coast',cap:'Yamoussoukro',r:'africa',d:'hard',x:['gh','ml','gn']},
  {id:'sn',name:'Senegal',cap:'Dakar',r:'africa',d:'hard',x:['ml','mr','gn']},
  {id:'ml',name:'Mali',cap:'Bamako',r:'africa',d:'hard',x:['sn','mr','bf']},
  {id:'bf',name:'Burkina Faso',cap:'Ouagadougou',r:'africa',d:'hard',x:['ml','gh','ci']},
  {id:'gn',name:'Guinea',cap:'Conakry',r:'africa',d:'hard',x:['sn','sl','ci']},
  {id:'rw',name:'Rwanda',cap:'Kigali',r:'africa',d:'hard',x:['bi','ug','cd']},
  {id:'so',name:'Somalia',cap:'Mogadishu',r:'africa',d:'hard',x:['et','ke','dj']},
  {id:'us',name:'United States',cap:'Washington D.C.',r:'americas',d:'easy',x:['ca','mx','cu']},
  {id:'mx',name:'Mexico',cap:'Mexico City',r:'americas',d:'easy',x:['us','gt','bz']},
  {id:'br',name:'Brazil',cap:'Brasília',r:'americas',d:'easy',x:['ar','co','pe']},
  {id:'ca',name:'Canada',cap:'Ottawa',r:'americas',d:'easy',x:['us','gl','pm']},
  {id:'ar',name:'Argentina',cap:'Buenos Aires',r:'americas',d:'easy',x:['cl','uy','py']},
  {id:'co',name:'Colombia',cap:'Bogotá',r:'americas',d:'medium',x:['ve','pe','ec']},
  {id:'ve',name:'Venezuela',cap:'Caracas',r:'americas',d:'medium',x:['co','gy','tt']},
  {id:'pe',name:'Peru',cap:'Lima',r:'americas',d:'medium',x:['ec','bo','cl']},
  {id:'cl',name:'Chile',cap:'Santiago',r:'americas',d:'medium',x:['ar','pe','bo']},
  {id:'bo',name:'Bolivia',cap:'Sucre',r:'americas',d:'medium',x:['pe','ar','py']},
  {id:'cu',name:'Cuba',cap:'Havana',r:'americas',d:'medium',x:['jm','ht','do']},
  {id:'ec',name:'Ecuador',cap:'Quito',r:'americas',d:'medium',x:['co','pe','ve']},
  {id:'py',name:'Paraguay',cap:'Asunción',r:'americas',d:'hard',x:['bo','ar','br']},
  {id:'uy',name:'Uruguay',cap:'Montevideo',r:'americas',d:'hard',x:['ar','br','py']},
  {id:'cr',name:'Costa Rica',cap:'San José',r:'americas',d:'hard',x:['ni','pa','hn']},
  {id:'pa',name:'Panama',cap:'Panama City',r:'americas',d:'hard',x:['cr','co','jm']},
  {id:'ni',name:'Nicaragua',cap:'Managua',r:'americas',d:'hard',x:['hn','cr','sv']},
  {id:'hn',name:'Honduras',cap:'Tegucigalpa',r:'americas',d:'hard',x:['ni','sv','gt']},
  {id:'sv',name:'El Salvador',cap:'San Salvador',r:'americas',d:'hard',x:['hn','gt','ni']},
  {id:'gt',name:'Guatemala',cap:'Guatemala City',r:'americas',d:'hard',x:['mx','bz','hn']},
  {id:'jm',name:'Jamaica',cap:'Kingston',r:'americas',d:'hard',x:['cu','ht','tt']},
  {id:'ht',name:'Haiti',cap:'Port-au-Prince',r:'americas',d:'hard',x:['do','cu','jm']},
  {id:'do',name:'Dominican Rep.',cap:'Santo Domingo',r:'americas',d:'hard',x:['ht','cu','pr']},
];

// ─── SETTINGS ───────────────────────────────────────────────────────
let S={regions:['europe','asia','africa','americas'],diff:'medium',style:'mc',mode:'rounds'};
(()=>{try{const s=localStorage.getItem('kw_s');if(s)S={...S,...JSON.parse(s)};}catch(e){}})();
const saveS=()=>localStorage.setItem('kw_s',JSON.stringify(S));

// ─── WRONG LOG ──────────────────────────────────────────────────────
function getWrong(){try{return JSON.parse(localStorage.getItem('kw_wrong')||'{}');}catch(e){return{};}}
function logWrong(id){const w=getWrong();w[id]=(w[id]||0)+1;localStorage.setItem('kw_wrong',JSON.stringify(w));}
function clearWrong(){localStorage.removeItem('kw_wrong');}

// ─── BOARD ──────────────────────────────────────────────────────────
const getBoard=()=>{try{return JSON.parse(localStorage.getItem('kw_board')||'[]');}catch(e){return[];}};
const setBoard=b=>localStorage.setItem('kw_board',JSON.stringify(b));
function addEntry(e){const b=getBoard();b.unshift(e);b.splice(100);setBoard(b);}

let lbMode='flags'; // current leaderboard filter

function renderBoard(){
  const b=getBoard();
  // Filter by selected mode tab
  const rounds=b.filter(e=>e.gamemode==='rounds'&&e.mode===lbMode);
  const marathon=b.filter(e=>e.gamemode==='marathon'&&e.mode===lbMode);

  const rEl=document.getElementById('lb-rounds');
  const mEl=document.getElementById('lb-marathon');

  if(!rounds.length){rEl.innerHTML='<div class="lb-empty">No rounds yet</div>';}
  else{
    rEl.innerHTML=rounds.slice(0,8).map((e,i)=>`
      <div class="lb-row">
        <span class="lb-rank">${String(i+1).padStart(2,'0')}</span>
        <div class="lb-mr">
          <span class="lb-date">${e.date}</span>
          <div class="lb-badges"><span class="lb-badge">${e.diff}</span><span class="lb-badge">${e.style==='mc'?'MC':'Type'}</span><span class="lb-badge">${e.correct}/${e.total}</span></div>
        </div>
        <div><div class="lb-val">${e.score}%</div><div class="lb-sub">${e.time}</div></div>
      </div>`).join('');
  }

  if(!marathon.length){mEl.innerHTML='<div class="lb-empty">No marathons yet</div>';}
  else{
    mEl.innerHTML=marathon.slice(0,8).map((e,i)=>`
      <div class="lb-row">
        <span class="lb-rank">${String(i+1).padStart(2,'0')}</span>
        <div class="lb-mr">
          <span class="lb-date">${e.date}</span>
          <div class="lb-badges"><span class="lb-badge">${e.diff}</span><span class="lb-badge">${e.total}q</span></div>
        </div>
        <div><div class="lb-val">${e.streak}</div><div class="lb-sub">streak</div></div>
      </div>`).join('');
  }

  // Wrong log
  const wrong=getWrong();
  const wEl=document.getElementById('lb-wrong');
  const wEntries=Object.entries(wrong).sort((a,b)=>b[1]-a[1]).slice(0,15);
  if(!wEntries.length){wEl.innerHTML='<div class="lb-empty">No mistakes logged yet</div>';}
  else{
    wEl.innerHTML=wEntries.map(([id,count])=>{
      const c=C.find(x=>x.id===id);if(!c)return'';
      return`<div class="lb-wrong-row">
        <img class="lb-wrong-flag" src="${flagUrl(id)}" alt="${c.name}" onerror="this.style.display='none'">
        <div class="lb-wrong-info"><div class="lb-wrong-name">${c.name}</div><div class="lb-wrong-detail">Capital: ${c.cap}</div></div>
        <div class="lb-wrong-count">×${count}</div>
      </div>`;
    }).join('');
  }
}

function updateHomeStats(){
  const b=getBoard();if(!b.length)return;
  document.getElementById('hstats').classList.remove('hidden');
  const rounds=b.filter(e=>e.gamemode==='rounds');
  const best=rounds.length?Math.max(...rounds.map(e=>e.score)):0;
  const bestStreak=Math.max(...b.map(e=>e.streak||0));
  document.getElementById('hs-r').textContent=rounds.length;
  document.getElementById('hs-b').textContent=(best||'—')+(best?'%':'');
  document.getElementById('hs-s').textContent=bestStreak;
}

// ─── QUIZ ENGINE ─────────────────────────────────────────────────────
let Q=null,tiv=null;
function pool(){
  const dm={easy:['easy'],medium:['easy','medium'],hard:['easy','medium','hard']};
  return C.filter(c=>S.regions.includes(c.r)&&dm[S.diff].includes(c.d));
}
const getW=()=>{try{return JSON.parse(localStorage.getItem('kw_w')||'{}');}catch(e){return{};}};
const setW=w=>localStorage.setItem('kw_w',JSON.stringify(w));
function boostW(id){const w=getW();w[id]=Math.min((w[id]||1)*2,12);setW(w);}
function decayW(id){const w=getW();if(w[id])w[id]=Math.max(w[id]*.65,1);setW(w);}

function wPick(p,ex=[]){
  const w=getW();
  const el=p.filter(c=>!ex.includes(c.id));
  if(!el.length)return p[Math.floor(Math.random()*p.length)];
  const tot=el.reduce((s,c)=>s+(w[c.id]||1),0);
  let r=Math.random()*tot;
  for(const c of el){r-=w[c.id]||1;if(r<=0)return c;}
  return el[el.length-1];
}

// Smarter distractors: strongly prefer confusable neighbours, fallback to same region
function getDist(country,p){
  const seen=new Set([country.id]);
  const f=[];
  // 1. confusable neighbours first
  for(const xid of(country.x||[])){
    const c=p.find(c=>c.id===xid&&!seen.has(c.id));
    if(c){f.push(c);seen.add(c.id);}
    if(f.length>=3)break;
  }
  // 2. same region, same difficulty
  if(f.length<3){
    const sameRD=p.filter(c=>!seen.has(c.id)&&c.r===country.r&&c.d===country.d);
    sameRD.sort(()=>Math.random()-.5);
    for(const c of sameRD){if(f.length>=3)break;f.push(c);seen.add(c.id);}
  }
  // 3. same region any difficulty
  if(f.length<3){
    const sameR=p.filter(c=>!seen.has(c.id)&&c.r===country.r);
    sameR.sort(()=>Math.random()-.5);
    for(const c of sameR){if(f.length>=3)break;f.push(c);seen.add(c.id);}
  }
  // 4. any remaining
  if(f.length<3){
    const rest=p.filter(c=>!seen.has(c.id));
    rest.sort(()=>Math.random()-.5);
    for(const c of rest){if(f.length>=3)break;f.push(c);seen.add(c.id);}
  }
  return f;
}

// Smart capital distractors: mix confusable capitals + non-capital cities
function getCapDist(country,pool){
  const base=getDist(country,pool);
  // For hard mode, occasionally replace one cap with a confusable non-capital city
  if(S.diff==='hard'&&Math.random()<0.5&&CITIES.length){
    const city=CITIES[Math.floor(Math.random()*CITIES.length)];
    // replace last distractor with city
    return [{...base[0]},{...base[1]},{id:'_city',name:'_',cap:city,flag:''}];
  }
  return base;
}

// Shuffle with anti-repeat: track last positions so correct answer moves around
let lastCorrectPos=-1;
function shuffleAntiRepeat(arr){
  // shuffle
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  // find correct (index 0 in input = correct country)
  // We passed [correct,...distractors] so after shuffle find where correct ended up
  return arr;
}

function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function startQuiz(mode){
  const p=pool();
  if(p.length<4){alert('Not enough countries. Adjust regions or difficulty.');return;}
  Q={mode,pool:p,hist:[],n:0,correct:0,streak:0,best:0,t0:Date.now(),marathon:S.mode==='marathon',answered:false,sel:null};
  showScreen('quiz');renderQ();
}

function renderQ(){
  const qs=document.getElementById('screen-quiz');
  qs.innerHTML='';
  if(!Q.marathon&&Q.n>=10){endRound();return;}
  const country=wPick(Q.pool,Q.hist.slice(-8));
  const dists=getDist(country,Q.pool);
  // Shuffle options, ensure correct answer doesn't land in same position twice in a row
  let opts=[country,...dists];
  shuf(opts);
  // avoid same position as last question
  let correctPos=opts.indexOf(country);
  let attempts=0;
  while(correctPos===lastCorrectPos&&attempts<6){shuf(opts);correctPos=opts.indexOf(country);attempts++;}
  lastCorrectPos=correctPos;

  Q.country=country;Q.opts=opts;Q.answered=false;Q.sel=null;
  Q.hist.push(country.id);
  const pct=Q.marathon?0:Math.round((Q.n/10)*100);
  qs.innerHTML=`<div class="qw">
    <div class="qhd">
      <span style="font-size:11px;font-weight:500;letter-spacing:.4px;text-transform:uppercase;color:var(--ink-3)">${Q.mode}</span>
      <div class="qpt"><div class="qpf" style="width:${pct}%"></div></div>
      <span class="qctr">${Q.marathon?'marathon':Q.n+'/10'}</span>
    </div>
    <div class="qmeta">
      <span class="qtimer" id="qtimer">0:00</span>
      <div class="qstrk">${Q.marathon?`<button class="mend" onclick="endMarathon()">End</button>`:''}<span>🔥</span><span class="qsn" id="qsn">${Q.streak}</span></div>
    </div>
    ${renderBody(Q.mode,country,opts)}
    <div id="fbslot" style="width:100%"></div>
  </div>`;
  startTimer();
}

function renderBody(mode,country,opts){
  if(mode==='flags'){
    return`<div class="qcard"><div class="fcb">
      <img class="flag-img" src="${flagUrl(country.id,128)}" alt="${country.name}" onerror="this.src='https://flagcdn.com/w80/${country.id}.png'">
      <span class="qclbl">Which country is this?</span>
    </div></div>
    <div class="choices">${opts.map((o,i)=>`<button class="ch" id="c${i}" onclick="aFlag(${i},'${o.id}','${country.id}')">${o.name}</button>`).join('')}</div>`;
  }
  if(mode==='capitals'){
    const capDists=getCapDist(country,Q.pool);
    if(S.style==='mc'){
      // Build capital options with possible city decoys
      const allCaps=[country,...capDists];
      shuf(allCaps);
      // Ensure no same position repeat
      let pos2=allCaps.indexOf(country);let att2=0;
      while(pos2===lastCorrectPos&&att2<6){shuf(allCaps);pos2=allCaps.indexOf(country);att2++;}
      lastCorrectPos=pos2;
      return`<div class="qcard"><div class="ccb">
        <img class="cfsm-img" src="${flagUrl(country.id)}" alt="${country.name}" onerror="this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'">
        <div class="ccn">${country.name}</div>
        <div class="cclbl">What is the capital city?</div>
      </div></div>
      <div class="choices">${allCaps.map((o,i)=>`<button class="ch" id="c${i}" onclick="aCapMC(${i},'${o.cap||o}','${country.cap}')">${o.cap||o}</button>`).join('')}</div>`;
    } else {
      return`<div class="qcard"><div class="ccb">
        <img class="cfsm-img" src="${flagUrl(country.id)}" alt="${country.name}" onerror="this.style.display='none'">
        <div class="ccn">${country.name}</div>
        <div class="cclbl">What is the capital city?</div>
      </div>
      <div class="ciw"><input class="ci" id="ci" type="text" placeholder="Type the capital…" autocomplete="off" autocorrect="off" spellcheck="false"><button class="cbtn" id="cbtn" onclick="aCapType('${country.cap}','${country.id}')">Check</button></div>
      <div class="cfb" id="cfb"></div></div>`;
    }
  }
  if(mode==='locations'){
    const locDists=getDist(country,Q.pool);
    const locOpts=[country,...locDists];shuf(locOpts);
    let lpos=locOpts.indexOf(country);let latt=0;
    while(lpos===lastCorrectPos&&latt<6){shuf(locOpts);lpos=locOpts.indexOf(country);latt++;}
    lastCorrectPos=lpos;
    // render map async after DOM is ready
    setTimeout(()=>buildHighlightedMap(country.id),0);
    return`<div class="map-display-wrap">
      <div class="map-display-label">Which country is highlighted?</div>
      <div class="map-svg-area" id="map-svg-area"></div>
    </div>
    <div class="choices">${locOpts.map((o,i)=>`<button class="ch" id="c${i}" onclick="aLoc(${i},'${o.id}','${country.id}')">${o.name}</button>`).join('')}</div>`;
  }
}

// ─── D3 MAP RENDERER ─────────────────────────────────────────────────
const ISO3_NUM={AFG:'4',ALB:'8',DZA:'12',AGO:'24',ARG:'32',ARM:'51',AUS:'36',AUT:'40',AZE:'31',
  BHR:'48',BGD:'50',BLR:'112',BEL:'56',BLZ:'84',BTN:'64',BOL:'68',BIH:'70',BWA:'72',BRA:'76',
  BRN:'96',BGR:'100',BFA:'854',BDI:'108',KHM:'116',CMR:'120',CAN:'124',CAF:'140',TCD:'148',
  CHL:'152',CHN:'156',COL:'170',COG:'178',COD:'180',CRI:'188',CIV:'384',HRV:'191',CUB:'192',
  CYP:'196',CZE:'203',DNK:'208',DJI:'262',DOM:'214',ECU:'218',EGY:'818',SLV:'222',ERI:'232',
  EST:'233',ETH:'231',FIN:'246',FRA:'250',GAB:'266',GMB:'270',GEO:'268',DEU:'276',GHA:'288',
  GRC:'300',GTM:'320',GIN:'324',GNB:'624',GUY:'328',HTI:'332',HND:'340',HUN:'348',ISL:'352',
  IND:'356',IDN:'360',IRN:'364',IRQ:'368',IRL:'372',ISR:'376',ITA:'380',JAM:'388',JPN:'392',
  JOR:'400',KAZ:'398',KEN:'404',PRK:'408',KOR:'410',KWT:'414',KGZ:'417',LAO:'418',LVA:'428',
  LBN:'422',LBY:'434',LTU:'440',LUX:'442',MKD:'807',MWI:'454',MYS:'458',MLI:'466',MRT:'478',
  MEX:'484',MDA:'498',MNG:'496',MNE:'499',MAR:'504',MOZ:'508',MMR:'104',NAM:'516',NPL:'524',
  NLD:'528',NZL:'554',NIC:'558',NER:'562',NGA:'566',NOR:'578',OMN:'512',PAK:'586',PAN:'591',
  PRY:'600',PER:'604',PHL:'608',POL:'616',PRT:'620',QAT:'634',ROU:'642',RUS:'643',RWA:'646',
  SAU:'682',SEN:'686',SRB:'688',SLE:'694',SGP:'702',SVK:'703',SVN:'705',SOM:'706',ZAF:'710',
  SSD:'728',ESP:'724',LKA:'144',SDN:'729',SWE:'752',CHE:'756',SYR:'760',TWN:'158',TJK:'762',
  TZA:'834',THA:'764',TGO:'768',TTO:'780',TUN:'788',TUR:'792',TKM:'795',UGA:'800',UKR:'804',
  ARE:'784',GBR:'826',USA:'840',URY:'858',UZB:'860',VEN:'862',VNM:'704',YEM:'887',ZMB:'894',
  ZWE:'716'};

const ISO2_3={af:'AFG',al:'ALB',dz:'DZA',ao:'AGO',ar:'ARG',am:'ARM',at:'AUT',az:'AZE',
  bh:'BHR',bd:'BGD',by:'BLR',be:'BEL',bz:'BLZ',bt:'BTN',bo:'BOL',ba:'BIH',bw:'BWA',br:'BRA',
  bn:'BRN',bg:'BGR',bf:'BFA',bi:'BDI',kh:'KHM',cm:'CMR',ca:'CAN',cf:'CAF',td:'TCD',cl:'CHL',
  cn:'CHN',co:'COL',cg:'COG',cd:'COD',cr:'CRI',ci:'CIV',hr:'HRV',cu:'CUB',cy:'CYP',cz:'CZE',
  dk:'DNK',dj:'DJI',do:'DOM',ec:'ECU',eg:'EGY',sv:'SLV',er:'ERI',ee:'EST',et:'ETH',fi:'FIN',
  fr:'FRA',ga:'GAB',gm:'GMB',ge:'GEO',de:'DEU',gh:'GHA',gr:'GRC',gt:'GTM',gn:'GIN',gw:'GNB',
  gy:'GUY',ht:'HTI',hn:'HND',hu:'HUN',is:'ISL',in:'IND',id:'IDN',ir:'IRN',iq:'IRQ',ie:'IRL',
  il:'ISR',it:'ITA',jm:'JAM',jp:'JPN',jo:'JOR',kz:'KAZ',ke:'KEN',kp:'PRK',kr:'KOR',kw:'KWT',
  kg:'KGZ',la:'LAO',lv:'LVA',lb:'LBN',ly:'LBY',lt:'LTU',lu:'LUX',mk:'MKD',mw:'MWI',my:'MYS',
  ml:'MLI',mr:'MRT',mx:'MEX',md:'MDA',mn:'MNG',me:'MNE',ma:'MAR',mz:'MOZ',mm:'MMR',na:'NAM',
  np:'NPL',nl:'NLD',ni:'NIC',ng:'NGA',no:'NOR',om:'OMN',pk:'PAK',pa:'PAN',py:'PRY',pe:'PER',
  ph:'PHL',pl:'POL',pt:'PRT',qa:'QAT',ro:'ROU',ru:'RUS',rw:'RWA',sa:'SAU',sn:'SEN',rs:'SRB',
  sl:'SLE',sg:'SGP',sk:'SVK',si:'SVN',so:'SOM',za:'ZAF',ss:'SSD',es:'ESP',lk:'LKA',sd:'SDN',
  se:'SWE',ch:'CHE',sy:'SYR',tw:'TWN',tj:'TJK',tz:'TZA',th:'THA',tg:'TGO',tt:'TTO',tn:'TUN',
  tr:'TUR',tm:'TKM',ug:'UGA',ua:'UKR',ae:'ARE',gb:'GBR',us:'USA',uy:'URY',uz:'UZB',ve:'VEN',
  vn:'VNM',ye:'YEM',zm:'ZMB',zw:'ZWE'};

let _worldCache=null;
let _namesCache=null;
async function getWorld(){
  if(_worldCache)return _worldCache;
  const r=await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  _worldCache=await r.json();
  return _worldCache;
}

// Map our country ISO-2 ids to the name strings used in world-atlas
const ISO2_NAME={
  af:'Afghanistan',al:'Albania',dz:'Algeria',ao:'Angola',ar:'Argentina',am:'Armenia',
  at:'Austria',az:'Azerbaijan',bh:'Bahrain',bd:'Bangladesh',by:'Belarus',be:'Belgium',
  bz:'Belize',bt:'Bhutan',bo:'Bolivia',ba:'Bosnia and Herz.',bw:'Botswana',br:'Brazil',
  bn:'Brunei',bg:'Bulgaria',bf:'Burkina Faso',bi:'Burundi',kh:'Cambodia',cm:'Cameroon',
  ca:'Canada',cf:'Central African Rep.',td:'Chad',cl:'Chile',cn:'China',co:'Colombia',
  cg:'Congo',cd:'Dem. Rep. Congo',cr:'Costa Rica',ci:"Côte d'Ivoire",hr:'Croatia',
  cu:'Cuba',cy:'Cyprus',cz:'Czech Rep.',dk:'Denmark',dj:'Djibouti',do:'Dominican Rep.',
  ec:'Ecuador',eg:'Egypt',sv:'El Salvador',er:'Eritrea',ee:'Estonia',et:'Ethiopia',
  fi:'Finland',fr:'France',ga:'Gabon',gm:'Gambia',ge:'Georgia',de:'Germany',gh:'Ghana',
  gr:'Greece',gt:'Guatemala',gn:'Guinea',gw:'Guinea-Bissau',gy:'Guyana',ht:'Haiti',
  hn:'Honduras',hu:'Hungary',is:'Iceland',in:'India',id:'Indonesia',ir:'Iran',iq:'Iraq',
  ie:'Ireland',il:'Israel',it:'Italy',jm:'Jamaica',jp:'Japan',jo:'Jordan',kz:'Kazakhstan',
  ke:'Kenya',kp:'North Korea',kr:'South Korea',kw:'Kuwait',kg:'Kyrgyzstan',la:'Laos',
  lv:'Latvia',lb:'Lebanon',ly:'Libya',lt:'Lithuania',lu:'Luxembourg',mk:'Macedonia',
  mw:'Malawi',my:'Malaysia',ml:'Mali',mr:'Mauritania',mx:'Mexico',md:'Moldova',
  mn:'Mongolia',me:'Montenegro',ma:'Morocco',mz:'Mozambique',mm:'Myanmar',na:'Namibia',
  np:'Nepal',nl:'Netherlands',nz:'New Zealand',ni:'Nicaragua',ng:'Nigeria',no:'Norway',
  om:'Oman',pk:'Pakistan',pa:'Panama',py:'Paraguay',pe:'Peru',ph:'Philippines',
  pl:'Poland',pt:'Portugal',qa:'Qatar',ro:'Romania',ru:'Russia',rw:'Rwanda',
  sa:'Saudi Arabia',sn:'Senegal',rs:'Serbia',sl:'Sierra Leone',sg:'Singapore',
  sk:'Slovakia',si:'Slovenia',so:'Somalia',za:'South Africa',ss:'S. Sudan',es:'Spain',
  lk:'Sri Lanka',sd:'Sudan',se:'Sweden',ch:'Switzerland',sy:'Syria',tw:'Taiwan',
  tj:'Tajikistan',tz:'Tanzania',th:'Thailand',tg:'Togo',tt:'Trinidad and Tobago',
  tn:'Tunisia',tr:'Turkey',tm:'Turkmenistan',ug:'Uganda',ua:'Ukraine',ae:'United Arab Emirates',
  gb:'United Kingdom',us:'United States',uy:'Uruguay',uz:'Uzbekistan',ve:'Venezuela',
  vn:'Vietnam',ye:'Yemen',zm:'Zambia',zw:'Zimbabwe',ne:'Niger',er:'Eritrea',
  ng:'Nigeria',nz:'New Zealand',
};

async function buildHighlightedMap(cid){
  const wrap=document.getElementById('map-svg-area');
  if(!wrap)return;
  wrap.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--ink-3);font-size:12px;letter-spacing:.5px">Loading map…</div>';
  try{
    const [world,d3,topo]=await Promise.all([
      getWorld(),
      import('https://cdn.jsdelivr.net/npm/d3@7/+esm'),
      import('https://cdn.jsdelivr.net/npm/topojson-client@3/+esm')
    ]);
    const wrap2=document.getElementById('map-svg-area');
    if(!wrap2)return;

    const W=wrap2.clientWidth||460, H=210;

    // Build name→id index from world-atlas names object
    const namesObj=world.objects.countries.geometries.reduce((acc,g)=>{
      if(g.properties&&g.properties.name) acc[g.properties.name]=String(g.id);
      return acc;
    },{});

    // Match by name first, fall back to numeric ISO code
    const targetName=ISO2_NAME[cid];
    const targetNum=ISO3_NUM[ISO2_3[cid]];
    const targetId=targetName?namesObj[targetName]:null;

    // Shift translate down to crop Antarctica off the bottom
    const projection=d3.geoNaturalEarth1()
      .scale(W/5.6)
      .translate([W/2, H/2 + 30]);

    const path=d3.geoPath().projection(projection);
    const countries=topo.feature(world, world.objects.countries);

    // Filter Antarctica (id 10)
    const visible=countries.features.filter(d=>String(d.id)!=='10');

    const svg=d3.select(wrap2).html('').append('svg')
      .attr('viewBox',`0 0 ${W} ${H}`)
      .style('display','block').style('width','100%').style('height',H+'px');

    const g=svg.append('g');

    g.selectAll('path')
      .data(visible)
      .join('path')
      .attr('class', d=>{
        const sid=String(d.id);
        const hit=(targetId&&sid===targetId)||(targetNum&&sid===String(targetNum));
        return hit?'highlighted':'land';
      })
      .attr('d', path);

    // Zoom + pan; double-click/tap resets
    const zoom=d3.zoom()
      .scaleExtent([1, 12])
      .on('zoom', e=> g.attr('transform', e.transform));

    svg.call(zoom)
      .on('dblclick.zoom', ()=>
        svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity)
      );

    svg.on('touchstart', e=> e.stopPropagation(), {passive:false});

  } catch(e){
    console.error('Map error:',e);
    const w=document.getElementById('map-svg-area');
    if(w) w.innerHTML='<div style="padding:16px;color:var(--ink-3);font-size:12px;text-align:center">Map unavailable</div>';
  }
}

function startTimer(){
  stopTimer();
  const t0=Date.now();
  tiv=setInterval(()=>{
    const el=document.getElementById('qtimer');
    if(!el){stopTimer();return;}
    const s=Math.floor((Date.now()-t0)/1000);
    el.textContent=Math.floor(s/60)+':'+(s%60<10?'0':'')+s%60;
  },500);
}
function stopTimer(){if(tiv){clearInterval(tiv);tiv=null;}}

// ─── ANSWER HANDLERS ─────────────────────────────────────────────────
function aFlag(i,aid,cid){
  if(Q.answered)return;Q.answered=true;const ok=aid===cid;
  document.querySelectorAll('.ch').forEach((b,j)=>{
    b.disabled=true;
    if(Q.opts[j]&&Q.opts[j].id===cid)b.classList.add('ok');
    if(j===i&&!ok)b.classList.add('no');
  });
  handleMC(ok,C.find(c=>c.id===cid));
}

function aCapMC(i,ans,correct){
  if(Q.answered)return;Q.answered=true;const ok=ans===correct;
  document.querySelectorAll('.ch').forEach((b,j)=>{
    b.disabled=true;
    if(b.textContent===correct)b.classList.add('ok');
    if(j===i&&!ok)b.classList.add('no');
  });
  handleMC(ok,Q.country);
}

function aLoc(i,aid,cid){
  if(Q.answered)return;Q.answered=true;const ok=aid===cid;
  document.querySelectorAll('.ch').forEach((b,j)=>{
    b.disabled=true;
    // find which option is correct country
    const locOpts=Array.from(document.querySelectorAll('.ch')).map((_,idx)=>idx);
    if(b.textContent===C.find(c=>c.id===cid)?.name)b.classList.add('ok');
    if(j===i&&!ok)b.classList.add('no');
  });
  handleMC(ok,C.find(c=>c.id===cid));
}

function handleMC(ok,country){
  if(ok){Q.correct++;Q.streak++;Q.best=Math.max(Q.best,Q.streak);decayW(country.id);}
  else{Q.streak=0;boostW(country.id);logWrong(country.id);}
  const sn=document.getElementById('qsn');if(sn)sn.textContent=Q.streak;
  setTimeout(()=>nextQ(),ok?650:1200);
}

function aCapType(correct,cid){
  if(Q.answered)return;
  const inp=document.getElementById('ci');if(!inp)return;
  const val=inp.value.trim().toLowerCase();
  const ok=val===correct.toLowerCase()||(val.length>3&&correct.toLowerCase().includes(val));
  Q.answered=true;inp.disabled=true;inp.classList.add(ok?'ok':'no');
  const fb=document.getElementById('cfb');
  if(fb){fb.textContent=ok?'Correct!':'Answer: '+correct;fb.className='cfb '+(ok?'ok':'no');}
  document.getElementById('cbtn').disabled=true;
  if(ok){Q.correct++;Q.streak++;Q.best=Math.max(Q.best,Q.streak);decayW(cid);}
  else{Q.streak=0;boostW(cid);logWrong(cid);}
  const sn=document.getElementById('qsn');if(sn)sn.textContent=Q.streak;
  const slot=document.getElementById('fbslot');
  if(slot){
    const det=ok?Q.country.name+' · '+correct:'Correct answer: '+correct;
    slot.innerHTML=`<div class="fb"><span class="fb-icon">${ok?'✓':'✗'}</span><div class="fb-body"><div class="fb-v ${ok?'ok':'no'}">${ok?'Correct':'Incorrect'}</div><div class="fb-d">${det}</div></div><button class="fbnext" onclick="nextQ()">Next</button></div>`;
  }
}

document.addEventListener('keydown',e=>{if(e.key==='Enter'){const b=document.getElementById('cbtn');if(b&&!b.disabled)b.click();}});

function nextQ(){if(!Q.marathon)Q.n++;renderQ();}
function endMarathon(){endRound(true);}

function endRound(marathon=false){
  stopTimer();
  const total=marathon?Q.hist.length:10;
  const pct=total?Math.round((Q.correct/total)*100):0;
  const el=Math.round((Date.now()-Q.t0)/1000);
  const mins=Math.floor(el/60),secs=el%60;
  const ts=mins+'m '+(secs<10?'0':'')+secs+'s';
  addEntry({
    date:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
    mode:Q.mode,gamemode:S.mode,diff:S.diff,style:S.style,
    score:pct,time:ts,streak:Q.best,correct:Q.correct,total
  });
  document.getElementById('screen-quiz').innerHTML=`<div class="rcs">
    <div class="rc-ey">${marathon?'Marathon complete':'Round complete'}</div>
    <div class="rc-big">${marathon?Q.best:pct}<span style="font-size:32px;font-weight:300">${marathon?' streak':'%'}</span></div>
    <div class="rc-sub">${marathon?Q.hist.length+' questions played':Q.correct+' of '+total+' correct'}</div>
    ${Q.best>2?`<div class="rc-tag">🔥 ${Q.best} best streak</div>`:''}
    <div class="rc-grid">
      <div class="rc-st"><div class="rc-sn">${Q.correct}</div><div class="rc-sl">Correct</div></div>
      <div class="rc-st"><div class="rc-sn">${total-Q.correct}</div><div class="rc-sl">Wrong</div></div>
      <div class="rc-st"><div class="rc-sn">${ts}</div><div class="rc-sl">Time</div></div>
      <div class="rc-st"><div class="rc-sn">${Q.best}</div><div class="rc-sl">Best streak</div></div>
    </div>
    <div class="rc-acts">
      <button class="btn-p" onclick="startQuiz('${Q.mode}')">Play again</button>
      <button class="btn-s" onclick="showScreen('leaderboard');renderBoard()">View results</button>
      <button class="btn-s" onclick="showScreen('home');updateHomeStats()">Home</button>
    </div>
  </div>`;
}

// ─── NAVIGATION ──────────────────────────────────────────────────────
function showScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+name).classList.add('active');
  document.querySelectorAll('.np').forEach(p=>p.classList.toggle('active',p.dataset.screen===name));
}
document.querySelectorAll('.np').forEach(p=>p.addEventListener('click',()=>{
  showScreen(p.dataset.screen);
  if(p.dataset.screen==='leaderboard')renderBoard();
  if(p.dataset.screen==='home')updateHomeStats();
}));
document.querySelectorAll('.hmc').forEach(c=>c.addEventListener('click',()=>startQuiz(c.dataset.mode)));

// LB mode tabs
document.querySelectorAll('.lb-tab').forEach(t=>t.addEventListener('click',()=>{
  lbMode=t.dataset.lbmode;
  document.querySelectorAll('.lb-tab').forEach(x=>x.classList.toggle('active',x===t));
  renderBoard();
}));

// ─── SETTINGS DRAWER ─────────────────────────────────────────────────
const openD=()=>{document.getElementById('drawer').classList.add('open');document.getElementById('ov').classList.add('open');};
const closeD=()=>{document.getElementById('drawer').classList.remove('open');document.getElementById('ov').classList.remove('open');};
document.getElementById('settings-btn').addEventListener('click',openD);
document.getElementById('dx').addEventListener('click',closeD);
document.getElementById('ov').addEventListener('click',closeD);

document.querySelectorAll('.chip').forEach(chip=>{
  chip.addEventListener('click',()=>{
    const g=chip.dataset.g,v=chip.dataset.v;
    if(g==='region'){chip.classList.toggle('on');}
    else{document.querySelectorAll(`.chip[data-g="${g}"]`).forEach(c=>c.classList.remove('on'));chip.classList.add('on');}
  });
});

function syncChips(){
  document.querySelectorAll('.chip[data-g="region"]').forEach(c=>c.classList.toggle('on',S.regions.includes(c.dataset.v)));
  document.querySelectorAll('.chip[data-g="diff"]').forEach(c=>c.classList.toggle('on',c.dataset.v===S.diff));
  document.querySelectorAll('.chip[data-g="style"]').forEach(c=>c.classList.toggle('on',c.dataset.v===S.style));
  document.querySelectorAll('.chip[data-g="mode"]').forEach(c=>c.classList.toggle('on',c.dataset.v===S.mode));
}
syncChips();

const nightToggle=document.getElementById('night-toggle');
function applyNight(on){document.body.classList.toggle('night',on);nightToggle.checked=on;localStorage.setItem('kw_night',on?'1':'0');}
applyNight(localStorage.getItem('kw_night')==='1');
nightToggle.addEventListener('change',()=>applyNight(nightToggle.checked));

document.getElementById('dsave').addEventListener('click',()=>{
  const regions=[...document.querySelectorAll('.chip[data-g="region"].on')].map(c=>c.dataset.v);
  if(!regions.length){alert('Select at least one region.');return;}
  S.regions=regions;
  S.diff=document.querySelector('.chip[data-g="diff"].on')?.dataset.v||'medium';
  S.style=document.querySelector('.chip[data-g="style"].on')?.dataset.v||'mc';
  S.mode=document.querySelector('.chip[data-g="mode"].on')?.dataset.v||'rounds';
  saveS();closeD();
});

document.getElementById('lbclear').addEventListener('click',()=>{
  if(confirm('Clear all history and mistakes log?')){
    localStorage.removeItem('kw_board');
    clearWrong();
    renderBoard();
    updateHomeStats();
  }
});

updateHomeStats();

// ─── HOME LOGO ANIMATION — silent looping ────────────────────────────
(function(){
  const logo = document.getElementById('home-logo');
  const gap  = logo && logo.querySelector('.logo-gap');
  if(!logo || !gap) return;

  const GAP_W = '0.52em';
  const ease  = 'cubic-bezier(0.45, 0, 0.2, 1)';

  function set(el, props){ Object.assign(el.style, props); }

  function runCycle(){
    // 1. Open gap
    set(gap, { transition: `width 750ms ${ease}`, width: GAP_W });

    // 2. Underline fades in after gap is mostly open
    setTimeout(()=>{ logo.classList.add('logo-lined'); }, 650);

    // 3. Hold in split state
    // 4. Underline fades out first
    setTimeout(()=>{ logo.classList.remove('logo-lined'); }, 2800);

    // 5. Then gap closes
    setTimeout(()=>{
      set(gap, { transition: `width 750ms ${ease}`, width: '0' });
    }, 3200);

    // 6. Rest, then repeat
    setTimeout(runCycle, 5800);
  }

  setTimeout(runCycle, 1000);
})();
