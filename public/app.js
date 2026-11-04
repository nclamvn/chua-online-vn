import {clockLabel,gatheringFrame} from './gathering-time.js';
import {ROOMS,ZONES} from './world-rules.js?v=hoi-rong-1';
import {createPractice,practiceDefaults} from './practice.js';
import {closeGlassMenu,focusGlassSelect,mountGlassSelects,refreshGlassSelect} from './glass-select.js';
import {createFairAudio,fairBeat} from './fair-audio.js';
import {MARKET_STALLS} from './fair-catalog.js?v=hoi-rong-1';
const $ = (s,root=document)=>root.querySelector(s), $$=(s,root=document)=>[...root.querySelectorAll(s)];
const icons={
'chevron-down':'<path d="m6 9 6 6 6-6"/>',
check:'<path d="m5 12 4.2 4.2L19 6.5"/>',
bow:'<circle cx="17.8" cy="9.3" r="2.5"/><path d="M3 19h18M4 18l3-6 5 1 3 4 5 .3M9 13l-1.5 5"/>',
view:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 16 4-4 4 3 4-5 4 4"/><circle cx="8" cy="9" r="1"/>',
follow:'<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3m13 5h3a2 2 0 0 0 2-2v-3"/><circle cx="12" cy="12" r="3"/>',
plus:'<path d="M5 12h14M12 5v14"/>',minus:'<path d="M5 12h14"/>',
market:'<path d="M3 10h18l-2-6H5l-2 6ZM4 10v10h16V10M9 20v-5h6v5M3 10q3 4 6 0 3 4 6 0 3 4 6 0M9 4l-1 6m7-6 1 6"/>',
user:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',map:'<path d="m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3V5Zm6-3v17m8-14v17"/>',coins:'<circle cx="9" cy="9" r="7"/><path d="M15 7a7 7 0 1 1-8 8M6 6h6v6H6zM16 14v5m-2-2h4"/>',ticket:'<path d="M4 3h16v18l-4-2-4 2-4-2-4 2V3ZM8 7h8m-8 4h8m-8 4h4"/>',tea:'<path d="M3 9h14v6a6 6 0 0 1-12 0V9Zm14 0h2a3 3 0 0 1 0 6h-2M3 22h15M8 2v3m5-3v3"/>',people:'<circle cx="8" cy="7" r="3"/><path d="M2 21v-4a6 6 0 0 1 12 0v4m2-13a3 3 0 1 0-1-6m2 11a5 5 0 0 1 5 5v3"/>',
'volume-off':'<path d="M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6"/>',volume:'<path d="M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
sliders:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="3" fill="currentColor" stroke="none"/>',
help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .5-1.5 1-1.5 2m0 3h.01"/>',
bell:'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4M12 2v2"/>',
hands:'<path d="m12 19-5 3-5-7 5-5 3-7q2-1 2 1v15Zm0 0 5 3 5-7-5-5-3-7q-2-1-2 1M7 10l1 6m9-6-1 6"/>',
beads:'<circle cx="12" cy="4" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="21" cy="12" r="2"/><circle cx="18" cy="18" r="2"/><circle cx="12" cy="20" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="3" cy="12" r="2"/><circle cx="6" cy="6" r="2"/>',
lotus:'<path d="M12 21C3 20 1 14 2 10c5 0 9 5 10 11Zm0 0c9-1 11-7 10-11-5 0-9 5-10 11ZM12 21C5 15 7 7 12 3c5 4 7 12 0 18Z"/>',
breathe:'<circle cx="12" cy="5" r="2"/><path d="m9 10 3 2 3-2m-3 2v4m-3-6-2 5-4 1m12-6 2 5 4 1M9 16l-5 3q-1 3 4 2l4-2 4 2q5 1 4-2l-5-3"/>',
wood:'<path d="M4 16c-3-6 0-11 7-11 8 0 11 6 9 11-3 5-13 5-16 0Z"/><path d="M8 8c3 1 7 1 10 0M14 3l5-2m-1 0 3 3"/>',incense:'<path d="M5 16h14l-2 5H7l-2-5ZM9 16V8m6 8V7M9 5c-3-2 3-3 0-5m6 4c-2-2 3-3 1-4"/>',leaf:'<path d="M20 3C5 1 1 12 6 17S23 15 20 3ZM4 21 16 9"/>',
x:'<path d="m6 6 12 12M6 18 18 6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
'arrow-right':'<path d="M4 12h16m-5-5 5 5-5 5"/>',mouse:'<rect x="6" y="2" width="12" height="20" rx="6"/><path d="M12 5v5"/>',expand:'<path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"/>',minimize:'<path d="M3 9h6V3m6 0v6h6M9 21v-6H3m18 0h-6v6"/>'};
function icon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.leaf}</svg>`}
function hydrate(root=document){$$('[data-icon]',root).forEach(el=>el.innerHTML=icon(el.dataset.icon))}hydrate();mountGlassSelects(document,icon);
const state={sound:false,volume:.45,scene:'afternoon',beads:0,lanterns:[],reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,entered:false,quality:innerWidth<700?'light':'balanced',ambientVolume:.18,...practiceDefaults};
let toastTimer,closeReturn, audio, master, effectsGain, ambient, ambientGain, fairAudio, activePanel=null, bellUntil=0, temple=null, presence=null, extras=null, nearby=null;
try{const prefs=JSON.parse(localStorage.getItem('hien-an-prefs')||'{}');if(['morning','afternoon','night'].includes(prefs.scene))state.scene=prefs.scene;if(typeof prefs.reduced==='boolean')state.reduced=prefs.reduced;if(Number.isFinite(prefs.volume))state.volume=Math.max(0,Math.min(1,prefs.volume));if(['light','balanced','high'].includes(prefs.quality))state.quality=prefs.quality;if(Number.isFinite(prefs.ambientVolume))state.ambientVolume=Math.max(0,Math.min(1,prefs.ambientVolume));for(const [key,defaultValue] of Object.entries(practiceDefaults)){const value=prefs[key];if(typeof defaultValue==='boolean'&&typeof value==='boolean')state[key]=value;if(typeof defaultValue==='number'&&Number.isFinite(value))state[key]=Math.max(0,Math.min(1,value))}state.beads=Math.max(0,Math.min(999999,Number(localStorage.getItem('hien-an-beads'))||0))}catch{}
function savePrefs(){try{localStorage.setItem('hien-an-prefs',JSON.stringify({scene:state.scene,reduced:state.reduced,volume:state.volume,quality:state.quality,ambientVolume:state.ambientVolume,...Object.fromEntries(Object.keys(practiceDefaults).map(key=>[key,state[key]]))}))}catch{}}
function toast(msg){$('#toast').textContent=msg;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),4000)}
function setScene(s){state.scene=s;document.body.dataset.time=s;$('#time-label').textContent={morning:'Sớm trong',afternoon:'Chiều an',night:'Đêm tĩnh'}[s];temple?.setTime(s);savePrefs()}
function setMotion(value){state.reduced=value;document.body.classList.toggle('reduced-motion',value);temple?.setReduced(value);savePrefs()}
setScene(state.scene);setMotion(state.reduced);
for(let i=0;i<15;i++){const p=document.createElement('i');p.className='particle';p.style.cssText=`left:${32+i*4.5}%;top:${30+(i*19)%60}%;animation-delay:${-(i*2.3)}s;animation-duration:${8+(i%5)}s`;$('#particles').append(p)}
async function soundReady(){if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('unsupported');audio=new Audio();master=audio.createGain();master.gain.value=0;master.connect(audio.destination);effectsGain=audio.createGain();effectsGain.connect(master)}if(audio.state==='suspended')await audio.resume()}
function strike(type='bell'){
 if(!state.sound||!state.effectsEnabled||!audio||audio.state!=='running'||(document.hidden&&!state.backgroundAudio))return;
 const now=audio.currentTime; const partials=type==='bell'?[[196,1],[393,.36],[537,.16],[793,.13],[1181,.08],[1590,.035]]:[[420,.8],[720,.23],[1150,.1]];
 for(const [freq,weight] of partials){const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,now);g.gain.setValueAtTime(.001,now);g.gain.exponentialRampToValueAtTime(weight*.14,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+(type==='bell'?7:0.28));o.connect(g);g.connect(effectsGain);o.start(now);o.stop(now+(type==='bell'?8:.35))}
}
function startAmbient(){if(ambient||!audio)return;const len=audio.sampleRate*4,buffer=audio.createBuffer(1,len,audio.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<len;i++){last=(last+Math.random()*.04-.02)/1.02;data[i]=last*2}const source=audio.createBufferSource();source.buffer=buffer;source.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=450;const g=audio.createGain();ambientGain=g;g.gain.value=state.ambientVolume;source.connect(filter);filter.connect(g);g.connect(master);source.start();ambient=source}
function updateFairAudio(){
 if(!fairAudio)return;
 const now=performance.now();
 fairAudio.update({state:temple?.getLocalState(),now,enabled:state.sound&&state.ambientEnabled&&(!document.hidden||state.backgroundAudio),
  volume:state.ambientVolume,count:Number($('#crowd-select').value),beat:fairBeat(now)});
}
function applyAudioMix(){
 if(!audio)return;
 const now=audio.currentTime;
 master.gain.setTargetAtTime(state.sound&&(!document.hidden||state.backgroundAudio)?state.volume:0,now,.08);
 effectsGain.gain.setTargetAtTime(state.effectsEnabled?state.effectsVolume:0,now,.08);
 ambientGain?.gain.setTargetAtTime(state.ambientEnabled?state.ambientVolume:0,now,.08);
 updateFairAudio();
 practice.updateVolume();
}
let soundGeneration=0;
async function setSound(enabled,announce=true){
 const generation=++soundGeneration;
 try{
  if(enabled)await soundReady();
  if(generation!==soundGeneration)return;
  state.sound=enabled;
  if(enabled){
   startAmbient();
   if(!fairAudio){
    fairAudio=createFairAudio({audio,master,caption:$('#fair-caption'),host:$('#scene3d')});
    setInterval(updateFairAudio,100);
   }
  }
  applyAudioMix();
  if(!enabled)practice.sync();
  if($('#master-sound'))$('#master-sound').checked=enabled;
  $('#sound').innerHTML=icon(enabled?'volume':'volume-off');
  $('#sound').setAttribute('aria-label',enabled?'Tắt âm thanh':'Bật âm thanh');
  $('#sound').setAttribute('aria-pressed',String(enabled));
  if(announce)toast(enabled?'Đã bật âm thanh.':'Đã tắt âm thanh.');
 }catch{toast('Trình duyệt chưa phát được âm thanh. Bạn vẫn có thể trải nghiệm bằng hình ảnh.')}
}
const practice=createPractice({state,panel,isActive:key=>activePanel===key,toast,setSound,
 getAudio:()=>({audio,master}),getTime:()=>presence?.getServerTime()??Date.now(),
 tapMoktak:()=>{temple?.act('wood');strike('wood')}});
function toggleSound(){return setSound(!state.sound)}
$('#sound').addEventListener('click',toggleSound);
function enter(){if(!$('#leave-screen').hidden)return;const keyboardEntry=document.activeElement?.matches('#welcome button:focus-visible');if(!state.entered)temple?.enter?.();presence?.start();state.entered=true;document.body.classList.add('entered');$('#welcome').inert=true;$('#walk-hint').style.opacity='1';toast('Chạm để đi, kéo để nhìn. Mở Bản đồ hoặc nhấn M để khám phá các khu.');if(keyboardEntry)focusGlassSelect($('#scene-location'))}
$('#enter').addEventListener('click',enter);
function leaveCourtyard(){
 if(!state.entered)return;
 closePanel(false);
 if(!$('#breath-overlay').hidden)closeBreath();
 extras?.stopBows();
 practice.stop();
 setSound(false,false);
 presence?.stop();
 state.entered=false;
 document.body.classList.remove('entered');
 document.body.classList.add('left-courtyard');
 setBackgroundInert(true);
 $('#leave-screen').hidden=false;
 $('#return-to-courtyard').focus();
}
const practiceTools=$('.practice-tools');
const practiceTrigger=$('#practice-trigger');
document.addEventListener('pointerdown',event=>{
 if(practiceTools.open&&!practiceTools.contains(event.target))practiceTools.open=false;
});
$('#leave-open').onclick=leaveCourtyard;
$('#return-to-courtyard').onclick=()=>{
 $('#leave-screen').hidden=true;
 document.body.classList.remove('left-courtyard');
 setBackgroundInert(false);
 enter();
 practiceTrigger.focus();
};
function move(x,y){if(!state.entered)enter();const a=$('#avatar');const nx=Math.max(8,Math.min(92,x)),ny=Math.max(24,Math.min(90,y));a.style.left=nx+'%';a.style.top=ny+'%';const d=$('#destination');d.style.left=nx+'%';d.style.top=ny+'%';d.style.opacity='1';setTimeout(()=>d.style.opacity='0',1100)}
$('#walk-zone').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect();move((e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100)});
function closePanel(returnFocus=true){closeGlassMenu();extras?.onClose();$('#panel').hidden=true;$('#panel-backdrop').hidden=true;$('#panel-content').replaceChildren();activePanel=null;$$('.action-dock button').forEach(x=>x.classList.remove('active'));setBackgroundInert(false);if(returnFocus&&closeReturn?.isConnected&&!closeReturn.closest('[inert]'))closeReturn.focus()}
function setBackgroundInert(value){if(value){closeGlassMenu();practiceTools.open=false}temple?.setEnabled(!value);$$('.topbar,.welcome,.scene-markers,.quiet-note,.walk-hint,.bottom-bar,footer,#walk-zone,.scene-tools,#context-action,.explore-rail,.sim-controls,.zone-label,.practice-tools').forEach(el=>el.inert=value);if(!value&&state.entered)$('#welcome').inert=true}
function panel(title,ico,html,key){if(activePanel===key){closePanel();return}const active=document.activeElement;const trigger=activePanel?closeReturn:practiceTools.contains(active)?practiceTrigger:active;closePanel(false);closeReturn=trigger;activePanel=key;$('#panel').dataset.kind=key;$('#panel-content').innerHTML=`<div class="panel-icon">${icon(ico)}</div><h2 id="panel-title">${title}</h2>${html}`;$('#panel').hidden=false;$('#panel').scrollTop=0;$('#panel-backdrop').hidden=false;setBackgroundInert(true);const content=$('#panel-content');queueMicrotask(()=>{if(activePanel===key)mountGlassSelects(content,icon)});$('#panel-close').focus();$(`[data-action="${key}"]`, $('#actions'))?.classList.add('active')}
$('#panel-close').onclick=()=>closePanel();$('#panel-backdrop').onclick=()=>closePanel();
function bell(){if(Date.now()<bellUntil){toast('Để tiếng chuông vừa thỉnh ngân thêm một chút.');return}bellUntil=Date.now()+2000;temple?.act('bell');strike();const p=document.createElement('i');p.className='bell-pulse';$('#bell-wave').append(p);setTimeout(()=>p.remove(),3100);toast(state.sound?'Một tiếng chuông. Một hơi thở.':'Tiếng chuông đang tắt. Bật biểu tượng âm thanh để lắng nghe.');}
function bow(){extras?.stopBows();closePanel();temple?.act('bow');presence?.greet();const a=$('#avatar');a.classList.add('bowing');setTimeout(()=>a.classList.remove('bowing'),2000);toast('Chắp tay, dành một lời chúc lành cho mình và mọi người.')}
function beads(){
 panel('Đi chậm, từng hạt một','beads','<p>Chạm, kéo vòng hạt, cuộn chuột hoặc dùng phím mũi tên khi vòng hạt được chọn.</p><button class="beads-circle" id="bead-tap" aria-label="Lần tràng hạt"><span class="beads-count"><span id="bead-count"></span><small id="bead-round-label">/ 108 hạt</small></span></button><button id="bead-next" class="primary">Lần một hạt</button><div class="service-actions"><button id="bead-reset" class="secondary">Bắt đầu lại</button><button id="bead-sound" class="secondary" aria-pressed="true">Tiếng hạt</button></div><small id="bead-total"></small>','beads');
 if(activePanel!=='beads')return;
 const ring=$('#bead-tap');
 for(let i=0;i<24;i++){
  const bead=document.createElement('i');
  bead.className='bead';
  bead.style.transform=`rotate(${i*15}deg) translateY(-82px)`;
  ring.append(bead);
 }
 const render=()=>{
  const count=state.beads%108||(state.beads?108:0);
  const round=Math.max(1,Math.ceil(state.beads/108));
  $('#bead-count').textContent=count;
  $('#bead-round-label').textContent='/ 108 · Vòng '+round;
  $('#bead-total').textContent='Tổng '+state.beads+' hạt · Lưu trên thiết bị này.';
  $$('.bead',ring).forEach((bead,i)=>bead.classList.toggle('lit',i<count/108*24));
 };
 let beadSound=true, lastStrike=0, drag=null, ignoreClick=false, wheelDistance=0, lastWheel=0;
 const countBeads=(n=1)=>{
  const priorRound=Math.floor(state.beads/108);
  state.beads+=n;
  try{localStorage.setItem('hien-an-beads',state.beads)}catch{}
  if(beadSound&&performance.now()-lastStrike>65){strike('wood');lastStrike=performance.now()}
  render();
  if(Math.floor(state.beads/108)>priorRound){if(beadSound)strike();toast('Đã tròn một vòng 108 hạt.')}
 };
 ring.onclick=e=>{if(!e.detail||!ignoreClick)countBeads();ignoreClick=false};
 ring.onpointerdown=e=>{
  if(!e.isPrimary||e.button!==0)return;
  ignoreClick=false;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY};
  ring.setPointerCapture(e.pointerId);
 };
 ring.onpointermove=e=>{
  if(drag?.id!==e.pointerId)return;
  const distance=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);
  const n=Math.floor(distance/28);
  if(!n)return;
  drag.x=e.clientX;drag.y=e.clientY;ignoreClick=true;
  countBeads(n);
 };
 ring.onlostpointercapture=()=>{drag=null};
 ring.addEventListener('wheel',e=>{
  if(e.ctrlKey)return;
  e.preventDefault();
  if(performance.now()-lastWheel>300)wheelDistance=0;
  lastWheel=performance.now();
  wheelDistance+=Math.abs(e.deltaY||e.deltaX)*(e.deltaMode?32:1);
  const n=Math.min(3,Math.floor(wheelDistance/70));
  if(n){wheelDistance%=70;countBeads(n)}
 },{passive:false});
 ring.onkeydown=e=>{
  if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();e.stopPropagation();countBeads();
 };
 $('#bead-next').onclick=()=>countBeads();
 $('#bead-sound').onclick=async()=>{
  if(beadSound&&state.sound){beadSound=false}
  else{if(!state.sound)await setSound(true,false);beadSound=state.sound}
  if(activePanel==='beads')$('#bead-sound').setAttribute('aria-pressed',String(beadSound&&state.sound));
 };
 $('#bead-sound').setAttribute('aria-pressed',String(beadSound&&state.sound));
 $('#bead-reset').onclick=()=>{
  state.beads=0;
  try{localStorage.removeItem('hien-an-beads')}catch{}
  render();
 };
 render();
}
function addLantern(text,save){temple?.act('lantern');const el=document.createElement('div');el.className='lantern';el.innerHTML='<span class="glow"></span>'+lotusSvg;el.style.left=(34+Math.random()*34)+'%';el.style.top=(80+Math.random()*7)+'%';$('#lanterns').append(el);state.lanterns.push(el);if(state.lanterns.length>12)state.lanterns.shift().remove();if(save){try{const list=JSON.parse(localStorage.getItem('hien-an-wishes')||'[]');list.push({text,date:new Date().toISOString()});localStorage.setItem('hien-an-wishes',JSON.stringify(list.slice(-10)))}catch{toast('Hoa đăng đã thả; trình duyệt chưa lưu được lời nhắn.');return}}toast('Hoa đăng đã thả. Mang một điều dịu dàng vào ngày của bạn.')}
function lantern(){panel('Gửi một điều an lành','lotus','<p>Một hoa đăng nhỏ, một lời nhắn cho chính mình. Lời nhắn không gửi lên máy chủ.</p><form id="wish-form"><label for="wish">Điều bạn muốn gửi gắm</label><textarea id="wish" maxlength="180" placeholder="Mong hôm nay mình biết nhẹ lòng hơn…"></textarea><small id="wish-length">0 / 180 ký tự</small><label class="check-row"><input id="remember-wish" type="checkbox">Giữ lời nhắn trong trình duyệt này</label><button type="submit" class="primary">Thả hoa đăng</button></form><small style="margin-top:16px">Có thể để trống lời nhắn. Hoa đăng là một tương tác tượng trưng.</small>','lantern');if(activePanel!=='lantern')return;let saved=[];try{const raw=JSON.parse(localStorage.getItem('hien-an-wishes')||'[]');if(Array.isArray(raw))saved=raw.filter(x=>typeof x?.text==='string').slice(-10)}catch{}if(saved.length){const box=document.createElement('details');box.className='saved-wishes';const title=document.createElement('summary');title.textContent='Lời nhắn đã giữ ('+saved.length+')';box.append(title);saved.slice().reverse().forEach(item=>{const p=document.createElement('p');p.textContent=item.text||'Một lời nguyện không thành lời.';box.append(p)});$('#panel-content').append(box)}$('#wish').oninput=e=>$('#wish-length').textContent=e.target.value.length+' / 180 ký tự';$('#wish-form').onsubmit=e=>{e.preventDefault();const text=$('#wish').value.trim(),save=$('#remember-wish').checked;closePanel();addLantern(text,save)}}
function settings(){
 const slider=(key,label)=>`<label class="field-row"><span>${label}</span><input id="${key}" type="range" min="0" max="100"></label>`;
 const check=(key,label)=>`<label class="field-row"><span>${label}</span><input id="${key}" type="checkbox"></label>`;
 panel('Theo nhịp của bạn','sliders',`<div class="practice-settings"><h3>Âm thanh</h3>
 ${check('master-sound','Bật âm thanh')}${slider('volume','Âm lượng tổng')}
 ${check('ambientEnabled','Âm nền và phố hội')}${slider('ambientVolume','Âm lượng nền')}
 ${check('effectsEnabled','Chuông, mõ và hiệu ứng')}${slider('effectsVolume','Âm lượng hiệu ứng')}
 ${slider('chantVolume','Âm lượng tụng')}${check('backgroundAudio','Tiếp tục phát khi rời tab')}
 ${practice.chantOptions()}
 <h3>Hình ảnh</h3><label for="scene-select">Ánh sáng trong sân</label>
 <select id="scene-select"><option value="morning">Sớm trong</option><option value="afternoon">Chiều an</option><option value="night">Đêm tĩnh</option></select>
 ${check('motion','Giảm chuyển động')}
 <label for="quality-select">Chất lượng hình ảnh</label>
 <select id="quality-select"><option value="light">Nhẹ</option><option value="balanced">Cân bằng</option><option value="high">Chi tiết</option></select>
 <div class="panel-divider"></div><button id="settings-help" class="secondary">Hướng dẫn sử dụng</button><button id="clear-local" class="secondary">Xóa dữ liệu trên trình duyệt này</button></div>`,'settings');
 if(activePanel!=='settings')return;
 $('#master-sound').checked=state.sound;
 $('#master-sound').onchange=e=>setSound(e.target.checked,false);
 for(const key of ['volume','ambientVolume','effectsVolume','chantVolume','ambientEnabled','effectsEnabled','backgroundAudio']){
  const input=document.getElementById(key);
  if(input.type==='range')input.value=String(Math.round(state[key]*100));
  else input.checked=state[key];
  input.oninput=()=>{state[key]=input.type==='range'?Number(input.value)/100:input.checked;applyAudioMix();practice.sync();savePrefs()};
 }
 const play=(button,handler)=>{$(button).onclick=()=>{if(!state.entered)enter();handler()}};
 practice.bindChant();
 for(const button of ['#chant-private','#chant-shared'])play(button,$(button).onclick);
 $('#settings-help').onclick=help;
 $('#quality-select').value=state.quality;
 $('#quality-select').onchange=e=>{state.quality=e.target.value;temple?.setQuality(state.quality);savePrefs()};
 $('#scene-select').value=state.scene;
 $('#scene-select').onchange=e=>setScene(e.target.value);
 $('#motion').checked=state.reduced;
 $('#motion').onchange=e=>setMotion(e.target.checked);
 $('#clear-local').onclick=()=>{
  try{
   ['hien-an-beads','hien-an-bows','hien-an-wishes','hien-an-prefs'].forEach(k=>localStorage.removeItem(k));
   extras?.resetBows();
   state.beads=0;
   state.lanterns.forEach(el=>el.remove());
   state.lanterns=[];
   temple?.act('clear');
   Object.assign(state,practiceDefaults,{volume:.45,ambientVolume:.18,quality:innerWidth<700?'light':'balanced'});
   temple?.setQuality(state.quality);
   setScene('afternoon');
   setMotion(matchMedia('(prefers-reduced-motion: reduce)').matches);
   localStorage.removeItem('hien-an-prefs');
   applyAudioMix();
   closePanel();
   toast('Đã xóa dữ liệu Hiên An lưu trong trình duyệt này.');
  }catch{toast('Trình duyệt không cho phép xóa dữ liệu. Hãy kiểm tra cài đặt lưu trữ.')}
 };
}
$('#settings').onclick=settings;
function help(){panel('Ghé chùa, thật nhẹ nhàng','help','<p>Chạm sân để đi. Kéo để xoay góc nhìn; cuộn chuột hoặc dùng hai ngón để thu phóng. Chạm bồ đoàn để ngồi, hoặc chọn một khu vực trong mục Ghé thăm.</p><div class="help-grid"><span><kbd>W A S D</kbd></span><span>Đi theo hướng nhìn; cũng dùng được phím mũi tên</span><kbd>E</kbd><span>Tương tác với vị trí đang ở gần</span><kbd>1</kbd><span>Thỉnh một tiếng chuông</span><kbd>2</kbd><span>Chắp tay</span><kbd>3</kbd><span>Lần tràng hạt</span><kbd>4</kbd><span>Thả hoa đăng</span><kbd>5</kbd><span>Ngồi yên theo nhịp thở</span><kbd>6 / 7</kbd><span>Gõ mõ / dâng hương</span><kbd>Esc</kbd><span>Đóng cửa sổ hoặc hiện giao diện</span></div><p>Trên điện thoại, chạm các nút có tên ở thanh phía dưới. Bật âm thanh ở góc trên nếu muốn nghe.</p>','help')}$('#help').onclick=help;
$('#about').onclick=()=>panel('Một khoảng bình yên','lotus','<p>Hiên An là một thử nghiệm thiết kế không gian Việt trên web, lấy cảm hứng từ nhu cầu ghé lại một nơi yên tĩnh.</p><p>Kiến trúc và tương tác được lập trình với Three.js. Cây, đá, HDRI và vật liệu PBR dùng asset CC0, có nguồn và giấy phép trong trang ghi công.</p><div class="panel-divider"></div><p>Đây là cảnh 3D dựng bằng Three.js trên thiết bị của bạn. Có thể đi qua một quần thể rộng, ghé các nhà hoạt động, chọn nhân vật, gieo quẻ chiêm nghiệm, lưu phiếu lễ demo và ngồi yên. Tên và bộ đếm ở sân chung chỉ thuộc các phiên đang kết nối với máy chủ. Đám đông mô phỏng được hiển thị và đếm riêng. Vị trí, chắp tay và tư thế ngồi được đồng bộ; lời nguyện vẫn ở trên thiết bị của bạn. Không đại diện cho chùa hoặc tổ chức tôn giáo.</p><p>Các thao tác là mô phỏng văn hóa và thư giãn. Chưa có thẩm định nghi lễ từ người có chuyên môn Phật học.</p><a class="link-line" href="research.html" target="_blank" rel="noopener">Đọc nghiên cứu và bằng chứng xây dựng ↗</a>','about');
$('#note-close').onclick=()=>$('#quiet-note').hidden=true;
$('#change-time').onclick=()=>{const times=['morning','afternoon','night'];setScene(times[(times.indexOf(state.scene)+1)%3])};
function focusMode(value){setBackgroundInert(value);temple?.setEnabled(true);document.body.classList.toggle('focus-mode',value);$('#focus').setAttribute('aria-pressed',String(value));$('#exit-focus').hidden=!value;if(value)$('#exit-focus').focus();else $('#focus').focus()}
$('#focus').onclick=()=>focusMode(true);$('#exit-focus').onclick=()=>focusMode(false);
let breathDuration=60,remaining=60,breathState='idle',breathTimer,deadline=0,phase=-1;
function updateClock(){$('#breath-time').textContent=clockLabel(remaining)}
function tick(){remaining=Math.max(0,Math.ceil((deadline-performance.now())/1000));const elapsed=breathDuration-remaining;const nextPhase=Math.floor(elapsed%10/4)===0?0:1;if(nextPhase!==phase){phase=nextPhase;$('#breath-title').textContent=phase===0?'Hít vào, nhẹ thôi':'Thở ra, buông lỏng';$('#breath-help').textContent=phase===0?'Một hơi thở, trở về với hiện tại.':'Để vai và bàn tay được thả lỏng.';$('#breath-overlay').classList.toggle('inhale',phase===0);$('#breath-overlay').classList.toggle('exhale',phase===1)}updateClock();if(remaining===0){clearInterval(breathTimer);breathState='done';$('#breath-title').textContent='Cảm ơn bạn đã dừng lại';$('#breath-help').textContent='Mang khoảng yên này trở lại với ngày của bạn.';$('#breath-toggle').textContent='Thực hành lại';$('#breath-overlay').classList.remove('inhale','exhale');strike()}}
function pauseBreath(){if(breathState!=='running')return;remaining=Math.max(1,Math.ceil((deadline-performance.now())/1000));clearInterval(breathTimer);breathState='paused';$('#breath-title').textContent='Bạn đang tạm dừng';$('#breath-help').textContent='Tiếp tục khi bạn sẵn sàng.';$('#breath-toggle').textContent='Tiếp tục';$('#breath-overlay').classList.remove('inhale','exhale');updateClock()}
function toggleBreath(){if(breathState==='running'){pauseBreath();return}if(breathState==='done')remaining=breathDuration;breathState='running';deadline=performance.now()+remaining*1000;phase=-1;tick();breathTimer=setInterval(tick,200);$('#breath-toggle').textContent='Tạm dừng'}
function openBreath(){if(temple&&temple.getLocalState().pose!=='meditate'){if(!state.entered)enter();temple.sitAt('hall');toast('Mời bạn đến bồ đoàn. Khi ngồi xuống, chọn Ngồi yên để bắt đầu.');return}closePanel(false);closeReturn=document.activeElement;setBackgroundInert(true);$('#breath-overlay').hidden=false;breathState='idle';remaining=breathDuration;$('#breath-title').textContent='Thả lỏng vai';$('#breath-help').textContent='Cứ thở theo nhịp tự nhiên của bạn.';$('#breath-toggle').textContent='Bắt đầu';updateClock();$('#breath-toggle').focus()}
function openGroupBreath(gathering,getTime){
 const overlay=$('#breath-overlay');
 const clock=$('#breath-time');
 const title=$('#breath-title');
 const help=$('#breath-help');
 const status=$('#group-breath-status');
 closeReturn=practiceTrigger;
 setBackgroundInert(true);
 overlay.dataset.mode='group';
 overlay.hidden=false;
 status.hidden=false;
 $('.breath-controls',overlay).hidden=true;
 $('#breath-toggle').hidden=true;
 $('.breath-eyebrow',overlay).textContent='Hẹn thiền · Vườn thiền';
 $('#breath-close').focus();
 let previous, lastInhale, seatAttempts=0, nextSeatAttempt=0;
 const update=()=>{
  const frame=gatheringFrame(gathering,getTime());
  clock.dataset.stage=frame.stage;
  clock.textContent=clockLabel(frame.seconds);
  const community=communityState;
  const connected=community.state==='online'&&community.room===gathering.room;
  const local=temple.getLocalState(), seatedInGarden=local.seat?.startsWith('zen:');
  if(connected&&frame.stage!=='ended'&&!seatedInGarden&&seatAttempts<3&&performance.now()>=nextSeatAttempt&&!local.travelTo&&local.pose!=='walk'){
   seatAttempts++;
   nextSeatAttempt=performance.now()+4500;
   temple.sitAt('zen');
  }
  const seated=connected?community.players.filter(p=>p.pose==='meditate'&&p.seat?.startsWith('zen:')).length:0;
  const connection=connected?seated+' khách đang ngồi trong Vườn thiền.':community.message||'Đang kết nối sân…';
  if(status.textContent!==connection)status.textContent=connection;
  if(frame.stage===previous&&frame.inhale===lastInhale)return;
  if((previous==='waiting'&&frame.stage==='active')||(previous==='active'&&frame.stage==='ended'))strike();
  previous=frame.stage;
  lastInhale=frame.inhale;
  title.textContent=frame.stage==='waiting'?'Chờ cùng nhau':frame.stage==='ended'?'Cuộc hẹn đã kết thúc':'Ngồi yên cùng nhau';
  help.textContent=frame.stage==='waiting'?'Thả lỏng vai. Đồng hồ sẽ tự bắt đầu.':frame.stage==='ended'?'Cảm ơn bạn đã dành khoảng yên này.':frame.inhale?'Hít vào, nhẹ thôi.':'Thở ra, chậm rãi.';
  overlay.classList.toggle('inhale',frame.inhale===true);
  overlay.classList.toggle('exhale',frame.inhale===false);
 };
 breathTimer=setInterval(update,200);
 update();
}
function closeBreath(){clearInterval(breathTimer);breathState='idle';$('#breath-overlay').hidden=true;delete $('#breath-overlay').dataset.mode;delete $('#breath-time').dataset.stage;$('#group-breath-status').hidden=true;$('.breath-controls',$('#breath-overlay')).hidden=false;$('#breath-toggle').hidden=false;$('.breath-eyebrow',$('#breath-overlay')).textContent='Một khoảng yên cho bạn';$('#breath-overlay').classList.remove('inhale','exhale');setBackgroundInert(false);if(closeReturn?.isConnected&&!closeReturn.closest('[inert]'))closeReturn.focus()}
$('#breath-toggle').onclick=toggleBreath;$('#breath-close').onclick=closeBreath;
$$('[data-duration]').forEach(b=>b.onclick=()=>{clearInterval(breathTimer);breathDuration=Number(b.dataset.duration);remaining=breathDuration;breathState='idle';phase=-1;$('#breath-overlay').classList.remove('inhale','exhale');$$('[data-duration]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#breath-title').textContent='Thả lỏng vai';$('#breath-help').textContent='Cứ thở theo nhịp tự nhiên của bạn.';$('#breath-toggle').textContent='Bắt đầu';updateClock()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseBreath();applyAudioMix();practice.sync();if(state.sound&&(!document.hidden||state.backgroundAudio))audio?.resume().then(()=>practice.sync()).catch(()=>{})});
function wood(){temple?.act('wood');strike('wood');toast(state.sound?'Một tiếng mõ, một nhịp dừng.':'Đã gõ mõ. Bật âm thanh để lắng nghe.')}function incense(){temple?.act('incense');toast('Một nén hương tượng trưng. Dành một điều lành cho hôm nay.')}const actions={alms:()=>toast('Hòm công đức trong mô phỏng.'),bell,bow,beads,lantern,breathe:openBreath,wood,incense,'fair-stop':()=>temple?.view('market'),...Object.fromEntries(['oracle','offerings','memorial','letters','tea','gathering','festival','profile','prostrate','map','rooms','market',...MARKET_STALLS.map(stall=>stall.id)].map(k=>[k,()=>extras?.open(k)]))};
$$('[data-action]').forEach(b=>b.onclick=()=>{if(!state.entered)enter();if(b.classList.contains('marker')&&temple){temple.go({bell:'bell',bow:'temple',lantern:'pond'}[b.dataset.action]);return}actions[b.dataset.action]()});
document.addEventListener('keydown',e=>{if(!$('#leave-screen').hidden){if(e.key==='Tab'||e.key==='Escape')e.preventDefault();return}const modal=!$('#breath-overlay').hidden?$('#breath-overlay'):!$('#panel').hidden?$('#panel'):null;if(e.key==='Escape'){e.preventDefault();if(practiceTools.open){practiceTools.open=false;practiceTrigger.focus();return}if(!$('#breath-overlay').hidden)closeBreath();else if(!$('#panel').hidden)closePanel();else if(document.body.classList.contains('focus-mode'))focusMode(false);return}if(e.key==='Tab'&&modal){const items=$$('button,a,input,textarea,select,summary',modal).filter(x=>!x.disabled&&x.getClientRects().length>0);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}return}if(document.body.classList.contains('focus-mode')&&!modal)return;if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||e.metaKey||e.ctrlKey||e.altKey||modal)return;const keyActions={'1':'bell','2':'bow','3':'beads','4':'lantern','5':'breathe','6':'wood','7':'incense'};if(keyActions[e.key]){e.preventDefault();actions[keyActions[e.key]]();return}if(e.key.toLowerCase()==='e'&&nearby){e.preventDefault();actions[nearby.type]?.();return}if(temple&&(e.key.startsWith('Arrow')||['w','a','s','d'].includes(e.key.toLowerCase()))){e.preventDefault();if(!state.entered)enter();temple.moveKey(e.key.startsWith('Arrow')?e.key:e.key.toLowerCase());return}if(e.key.startsWith('Arrow')){e.preventDefault();const a=$('#avatar'),x=parseFloat(a.style.left||'45'),y=parseFloat(a.style.top||'55');move(x+(e.key==='ArrowRight'?7:e.key==='ArrowLeft'?-7:0),y+(e.key==='ArrowDown'?10:e.key==='ArrowUp'?-10:0))}});

$('#scene-location').onchange=e=>{if(!e.target.value)return;if(temple){if(!state.entered)enter();temple.go(e.target.value)}else toast('Cảnh 3D đang được mở. Bạn có thể thử lại sau một chút.');e.target.value=''};
const hallAngle=$('#hall-angle');
hallAngle.onchange=()=>temple?.setHallAngle(hallAngle.value);
function updateHallView(mode){
 $('#hall-angle-control').hidden=mode==='exterior';
 if(mode==='exterior')return;
 hallAngle.value=mode;
 refreshGlassSelect(hallAngle);
}
$('#camera-home').onclick=()=>temple?.view('home');$('#zoom-in').onclick=()=>temple?.zoom(1);$('#zoom-out').onclick=()=>temple?.zoom(-1);
$('#context-action').onclick=()=>nearby&&actions[nearby.type]?.();
$('#dismiss-fallback').onclick=()=>$('#graphics-fallback').hidden=true;
Promise.all([import('./scene.js?v=hoi-rong-1'),import('./presence.js?v=pond-parking-1'),import('./experience.js?v=hoi-rong-1')]).then(([module,network,experience])=>{
 temple=module.createTemple({host:$('#scene3d'),markers:{bell:$('.bell-marker'),bow:$('.temple-marker'),lantern:$('.pond-marker')},onAction:type=>{if(!state.entered)enter();actions[type]?.()},onStatus:toast,onHallView:updateHallView,onSeat:()=>presence?.syncSeat(),onWalk:()=>extras?.stopBows(),onContext:value=>{nearby=value;$('#context-action').hidden=!value;if(value)$('#context-action span').textContent=value.type==='market'?'Xem chương trình':value.label},onReady:()=>{document.body.classList.add('webgl-ready');$('#scene-loading').hidden=true;}});
 const query=new URLSearchParams(location.search),requestedRoom=query.get('room');
 presence=network.createPresence({temple,room:ROOMS.includes(requestedRoom)?requestedRoom:ROOMS[0],onStatus:toast,onChange:updateCommunity});
 extras=experience.createExperience({temple,presence,panel:(...args)=>{if(activePanel===args[3])closePanel(false);panel(...args)},closePanel,isActive:key=>key?activePanel===key:!!activePanel,toast,enter,hasEntered:()=>state.entered,openBreath,openGroupBreath,strike,enableFairSound:()=>setSound(true),getCommunity:()=>communityState,leaveCourtyard});setInterval(()=>extras?.tick(performance.now()),500);if(state.entered){presence.start();temple.enter();}
 $('#scene3d canvas').addEventListener('click',()=>{if(!state.entered)enter()});
 temple.setTime(state.scene);temple.setReduced(state.reduced);temple.setQuality(state.quality);temple.setEnabled($('#panel').hidden&&$('#breath-overlay').hidden&&$('#leave-screen').hidden);
 if(query.has('hen')){
  presence.refreshClock().catch(()=>{}).then(()=>{if($('#leave-screen').hidden)extras.showInvite(query)});
 }else if(Object.hasOwn(ZONES,query.get('visit'))){
  const visit=query.get('visit');
  if(query.get('festival')==='1')extras.setCrowd(1000,false);
  extras.visit(visit);
  const show=query.get('show');
  if(visit==='market'&&(show==='lion'||show==='parade'))temple.view(show);
 }
}).catch(error=>{console.error('Hiên An 3D initialization failed',error);$('#scene-loading').hidden=true;$('#graphics-fallback').hidden=false;document.body.classList.add('illustrated-fallback');$('#scene3d').replaceChildren();});

const initialRoom=new URLSearchParams(location.search).get('room');
let communityState={state:'idle',room:ROOMS.includes(initialRoom)?initialRoom:ROOMS[0],players:[]};
function updateCommunity(value){communityState=value;$('#presence-label').textContent=value.state==='online'?`${value.room.slice(-2)} · ${value.players.length} người` : value.message;$('#presence-compact').textContent=value.state==='online'?String(value.players.length):'Sân';$('#community').dataset.state=value.state;$('#community').title=value.message;const list=$('#visitor-list');if(list){list.replaceChildren();for(const p of value.players){const li=document.createElement('li');li.textContent=p.name+(p.id===value.id?' · Bạn':'')+' · '+({idle:'Đang ngắm cảnh',walk:'Đang bước đi',greet:'Chắp tay',meditate:'Đang ngồi yên'}[p.pose]||'');list.append(li)}if(!value.players.length)list.textContent=value.message||'Chưa tham gia sân chung.'}}
window.addEventListener('pagehide',()=>presence?.stop());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)presence?.wake()});

window.addEventListener('pageshow',e=>{if(e.persisted&&state.entered)presence?.start()});
