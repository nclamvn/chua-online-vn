import {createGatherings,ROOM_NAMES} from './gathering.js?v=pond-parking-1';
import {refreshGlassSelect} from './glass-select.js';
import {COSTUMES} from './fair-catalog.js?v=hoi-rong-1';
import {createFairPanels} from './fair-panels.js?v=hoi-rong-1';
import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {ZONES,nearestZone,ROOMS,CAPACITY,WORLD,LOTUS_POND,FESTIVAL_COURT} from './world-rules.js?v=hoi-rong-1';
import {createVisitor,getPeopleManifest,CLOTH_PALETTE} from './avatar.js?v=pond-parking-1';
import {PARKING_LOT} from './parking-layout.js';
import {createServices} from './services.js';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const mapX=x=>x-WORLD.minX+12;
const mapZ=z=>z-WORLD.minZ+6;
const el=(tag,value,cls)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=value;if(cls)e.className=cls;return e};
export function createExperience({temple,presence,panel,closePanel,isActive,toast,enter,hasEntered,openBreath,openGroupBreath,strike,enableFairSound,getCommunity,leaveCourtyard}){
 const fair=createFairPanels({panel,toast,visit,temple,openProfile,showPerformance,enableFairSound,openOracle:()=>services.openOracle()});
 const services=createServices({panel,closePanel,isActive,toast,temple,getRoom:()=>getCommunity().room});let preview=null,lastTick=0,lastZone='',bowCount=0,bowLoop=false,bowTimer,teaTimer,roomGeneration=0,profileGeneration=0;
 try{bowCount=Math.max(0,Number(localStorage.getItem('hien-an-bows'))||0)}catch{}
 function visit(id){closePanel();if(!hasEntered())enter();temple.go(id);$('#zone-name').textContent=ZONES[id]?.name||'Hiên An';$$('[data-visit]').forEach(b=>b.classList.toggle('selected',b.dataset.visit===id))}
 function showPerformance(which){
  if(Number($('#crowd-select').value)===0)setCrowd(100);
  const p=temple.getLocalState();
  if(!hasEntered()||p.z<61||p.z>109||Math.abs(p.x)>19)visit('market');
  else closePanel();
  temple.view(which);
  toast(which==='lion'?'Múa lân · Bật âm thanh để nghe nhịp trống.':'Đang theo đoàn Tây Du Ký. Kéo cảnh để ngừng theo.');
 }
 function mapPanel(){panel('Khám phá Hiên An','leaf','<p class="service-intro">Mỗi mái hiên có một nhịp sinh hoạt. Chọn một khu để ghé nhanh hoặc đi theo những lối sân.</p><div class="precinct-map" id="precinct-map"></div><div id="destination-list" class="destination-list"></div><p class="service-note">Chấm xanh đánh dấu vị trí của bạn.</p>','map');const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${mapX(WORLD.maxX)+12} ${mapZ(WORLD.maxZ)+12}`);svg.setAttribute('aria-label','Bản đồ quần thể Hiên An');svg.setAttribute('role','img');
 const route=points=>'<polyline points="'+points.map(([x,z])=>mapX(x)+','+mapZ(z)).join(' ')+'" fill="none" stroke="var(--map-path)" stroke-width="4" stroke-linecap="round"/>';
 const area=(x,z,w,d,fill)=>'<rect x="'+mapX(x-w/2)+'" y="'+mapZ(z-d/2)+'" width="'+w+'" height="'+d+'" rx="2" fill="var(--map-'+fill+')"/>';
 const axis=[[0,-165],[0,-105],[-14,-93],[-17,-58],[-17,-27],[0,-12],[0,118]];
 svg.innerHTML=route(axis)+route([[-84,-146],[-77,-95],[-77,31],[-54,60],[54,60],[77,31],[77,-95],[84,-146]])+
  route([[-84,-146],[84,-146]])+route([[-77,-105],[77,-105]])+route([[-77,0],[77,0]])+
  area(0,(LOTUS_POND.northBank+LOTUS_POND.southBank)/2,LOTUS_POND.halfWidth*2,LOTUS_POND.southBank-LOTUS_POND.northBank,'water')+
  area(-53,-51,30,20,'water')+area(53,-51,30,20,'water')+area(0,22,5,18,'bridge')+
  area(0,FESTIVAL_COURT.z,FESTIVAL_COURT.width,FESTIVAL_COURT.depth,'square')+
  area(PARKING_LOT.x,PARKING_LOT.z,PARKING_LOT.width,PARKING_LOT.depth,'bridge');
 const main=['temple','arhat-west','arhat-east','compassion','tam-the','festival','market','oracle','offerings','tea','meditation','memorial','gate','pond','parking'];for(const id of main){const z=ZONES[id],g=document.createElementNS(ns,'g'),x=mapX(z.point[0]),y=mapZ(z.point[1]);g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label','Đến '+z.name);g.style.cursor='pointer';g.innerHTML=`<rect x="${x-13}" y="${y-12}" width="26" height="17" rx="2" fill="var(--map-marker)" stroke="var(--map-rim)" stroke-width=".8"/><path d="M${x-16} ${y-13}L${x} ${y-19}L${x+16} ${y-13}" fill="none" stroke="var(--map-rim)" stroke-width="2"/><circle cx="${x}" cy="${y+8}" r="2.2" fill="var(--map-rim)"/>`;g.onclick=()=>visit(id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();visit(id)}};svg.append(g);const b=el('button',undefined,'destination-row');b.append(el('strong',z.name),el('span',z.description||'Lối đi giữa những mái hiên.'));b.onclick=()=>visit(id);$('#destination-list').append(b)}
 const p=temple.getLocalState(),self=document.createElementNS(ns,'circle');self.setAttribute('cx',String(mapX(p.x)));self.setAttribute('cy',String(mapZ(p.z)));self.setAttribute('r','3.2');self.setAttribute('fill','var(--map-self)');self.setAttribute('stroke','#184a3e');self.setAttribute('stroke-width','1.5');svg.append(self);$('#precinct-map').append(svg)}
 function openProfile(initialOutfit){panel('Tủ hóa trang Hiên An','user','<p>Kéo để xoay mẫu 3D. Khách thật trong cùng sân sẽ thấy bộ đồ bạn chọn.</p><div class="profile-layout"><div class="profile-inspector"><div id="profile-preview" class="profile-preview"><span>Đang mở tủ nhân vật…</span></div><button id="profile-save" class="primary">Dùng nhân vật này</button></div><div class="profile-choices"><div id="costume-collections"></div><details class="profile-basics"><summary>Chỉnh dáng người và đồ thường</summary><div id="profile-options" class="profile-options"></div><label>Màu đồ thường</label><div id="profile-palettes" class="profile-palettes"></div><label class="check-row"><input type="checkbox" id="profile-bald">Ẩn tóc</label></details><small>Trang phục fan do Hiên An dựng cho phố hội.</small></div></div>','profile');const generation=++profileGeneration;let style=temple.getAppearance();
 const select=costume=>{
  style=costume?{...style,outfit:costume.id,profile:costume.profile,hair:costume.hair}:{...style,outfit:0,hair:0};
  $('#profile-bald').checked=style.hair===5;updatePreview();
 };
 const initial=COSTUMES.find(c=>c.id===initialOutfit);
 if(initial)style={...style,outfit:initial.id,profile:initial.profile,hair:initial.hair};
 const save=()=>{temple.setAppearance(style);try{localStorage.setItem('hien-an-avatar',JSON.stringify(style))}catch{}toast('Đã chọn nhân vật. Khách trong sân sẽ thấy ngoại hình mới.');closePanel()};$('#profile-save').onclick=save;$('#profile-bald').checked=style.hair===5;$('#profile-bald').onchange=e=>{style={...style,hair:e.target.checked?5:0};updatePreview()};
 function updatePreview(){
  if(preview){preview.rig.setAppearance(style).then(()=>preview?.render());preview.style=style}
  $$('[data-profile-choice]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.profileChoice)===style.profile)));
  $$('[data-costume]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.costume)===style.outfit)));
 }
 const collections=$('#costume-collections');
 for(const name of new Set(COSTUMES.map(c=>c.collection))){
  collections.append(el('h3',name,'costume-heading'));
  const group=el('div',undefined,'costume-grid');
  for(const costume of COSTUMES.filter(c=>c.collection===name)){
   const button=el('button',undefined,'costume-choice'),swatch=el('i');
   swatch.style.setProperty('--main',costume.colors[0]);swatch.style.setProperty('--trim',costume.colors[1]);
   button.dataset.costume=String(costume.id);button.append(swatch,el('span',costume.name));
   button.onclick=()=>select(costume);group.append(button);
  }
  collections.append(group);
 }
 const normal=el('button','Trở về đồ thường','secondary');
 normal.dataset.costume='0';normal.onclick=()=>select(null);collections.append(normal);
 updatePreview();
 CLOTH_PALETTE.forEach((color,i)=>{const b=el('button');b.style.background=color;b.setAttribute('aria-label','Màu trang phục '+(i+1));b.setAttribute('aria-pressed',String(style.palette===i));b.onclick=()=>{style={...style,palette:i,outfit:0};$('#profile-palettes').querySelectorAll('button').forEach((p,j)=>p.setAttribute('aria-pressed',String(i===j)));updatePreview()};$('#profile-palettes').append(b)});
 getPeopleManifest().then(manifest=>{if(!isActive('profile')||generation!==profileGeneration)return;const host=$('#profile-preview');host.replaceChildren();const scene=new T.Scene();const stand=new T.Mesh(new T.CylinderGeometry(.47,.53,.08,48),new T.MeshStandardMaterial({color:'#7f8370',roughness:.92}));stand.position.y=-.062;scene.add(stand);const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Xem nhân vật 3D, kéo để xoay');const camera=new T.PerspectiveCamera(33,host.clientWidth/host.clientHeight,.1,20);camera.position.set(1.65,1.42,3.65);scene.add(new T.HemisphereLight('#f5eee2','#596154',2.4));const key=new T.DirectionalLight('#fff4df',2.3);key.position.set(-3,5,4);scene.add(key);const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.91,0);controls.enablePan=false;controls.minDistance=2.3;controls.maxDistance=5;controls.update();const rig=createVisitor({name:'',npc:true,appearance:style});scene.add(rig.root);const render=()=>{if(!isActive('profile')||preview?.rig!==rig)return;rig.update('idle',0,true);controls.update();renderer.render(scene,camera)};controls.addEventListener('change',()=>renderer.render(scene,camera));const observer=new ResizeObserver(()=>{camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);render()});observer.observe(host);preview={renderer,rig,scene,controls,render,style,dispose(){observer.disconnect();controls.dispose();rig.dispose();stand.geometry.dispose();stand.material.dispose();renderer.dispose();host.replaceChildren()}};rig.ready.then(render);manifest.profiles.forEach((p,i)=>{const b=el('button',p.label,'profile-choice');b.dataset.profileChoice=String(i);b.setAttribute('aria-pressed',String(style.profile===i));b.onclick=()=>{style={...style,profile:i,hair:0};$('#profile-bald').checked=false;updatePreview()};$('#profile-options').append(b)});render()}).catch(e=>{if(isActive('profile'))$('#profile-preview').textContent=e.message})}
 const bowButton=$('[data-action="prostrate"]');
 const bowDock=bowButton.lastElementChild;
 function stopBows(){
  if(!bowLoop&&!bowTimer)return;
  bowLoop=false;
  clearTimeout(bowTimer);
  bowTimer=undefined;
  temple.act('stop-prostrate');
  bowDock.textContent='Lễ Phật';
  bowButton.setAttribute('aria-label','Lễ Phật 108');
 }
 function showBowCount(){
  if(!$('#bow-total'))return;
  $('#bow-total').textContent=String(bowCount);
  $('#bow-round').textContent=`Vòng ${Math.floor(bowCount/108)+1} · ${bowCount%108}/108 lễ`;
 }
 function bowOnce(){
  if(bowTimer)return;
  temple.act('prostrate');
  strike('wood');
  bowTimer=setTimeout(()=>{
   bowTimer=undefined;
   bowCount++;
   try{localStorage.setItem('hien-an-bows',String(bowCount))}catch{}
   showBowCount();
   if(bowCount%108===0){strike();toast('Đã tròn 108 lễ. Bạn có thể nghỉ bất cứ lúc nào.')}
   if(bowLoop)bowOnce();
  },3300);
 }
 function prostrate(){
  panel('Lễ Phật theo nhịp của bạn','hands','<p>Mỗi lễ là một nhịp dừng. Khi lạy liên tục, chạm Dừng lạy hoặc bước đi để kết thúc.</p><div class="ritual-progress"><strong id="bow-total"></strong><span id="bow-round"></span></div><div class="service-actions"><button id="bow-one" class="primary">Lạy một lễ</button><button id="bow-auto" class="secondary">Lạy liên tục</button></div><small>Số lễ chỉ lưu trên thiết bị này.</small>','prostrate');
  showBowCount();
  $('#bow-one').onclick=()=>{closePanel();bowOnce()};
  $('#bow-auto').onclick=()=>{bowLoop=true;bowDock.textContent='Dừng lạy';bowButton.setAttribute('aria-label','Dừng lạy');closePanel();bowOnce()};
 }
 function tea(){panel('Một chén trà, một nhịp dừng','leaf','<p>Đặt việc đang làm xuống trong một phút. Chỉ nhìn hơi trà và nghe khoảng sân.</p><div class="tea-cup" aria-hidden="true"><i></i><i></i><i></i><span></span></div><output id="tea-clock" class="ritual-progress">01:00</output><button id="tea-start" class="primary">Dừng cùng chén trà</button><button id="tea-seat" class="secondary">Đến ngồi ở hiên trà</button>','tea');$('#tea-seat').onclick=()=>{visit('tea')};$('#tea-start').onclick=()=>{clearInterval(teaTimer);let seconds=60;$('#tea-start').disabled=true;teaTimer=setInterval(()=>{if(!isActive('tea')){clearInterval(teaTimer);return}seconds--;$('#tea-clock').textContent='00:'+String(seconds).padStart(2,'0');if(!seconds){clearInterval(teaTimer);$('#tea-clock').textContent='Mang khoảng yên này theo bạn.';$('#tea-start').disabled=false}},1000)}}
 const gatherings=createGatherings({presence,panel,closePanel,isActive,getCommunity,hasEntered,enter,openGroupBreath,openBreath,toast});
 function festival(){panel('Nhịp sân hội','leaf','<p>Những bước chân, một cái chắp tay, một khoảng ngồi bên nhau. Chọn nhịp sinh hoạt cho cảnh của bạn.</p><div id="festival-options" class="festival-options"></div><p class="service-note">Đám đông này do thiết bị mô phỏng. Bộ đếm khách thật ở góc trên chỉ đếm các phiên kết nối máy chủ.</p><button id="festival-visit" class="primary">Đến sân hội</button><button id="festival-overview" class="secondary">Ngắm toàn quần thể</button>','festival');for(const [n,title,note] of [[0,'Yên tĩnh','Chỉ giữ khách thật và tiếng sân.'],[100,'Ngày thường','Những nhóm nhỏ giữa các mái hiên.'],[300,'Ngày rằm','Sân đông hơn, người qua lại giữa các nhà.'],[1000,'Ngày hội lớn','1.000 nhân vật mô phỏng, có mức chi tiết theo khoảng cách.']]){const b=el('button',undefined,'festival-choice');b.setAttribute('aria-pressed',String(Number($('#crowd-select').value)===n));b.append(el('strong',title),el('span',note));b.onclick=()=>{setCrowd(n);$('#festival-options').querySelectorAll('button').forEach((p,i)=>p.setAttribute('aria-pressed',String([0,100,300,1000][i]===n)))};$('#festival-options').append(b)}$('#festival-visit').onclick=()=>visit('festival');$('#festival-overview').onclick=()=>{closePanel();temple.view('overview')}}
 function setCrowd(n,persist=true){temple.setCrowd(n);const crowdSelect=$('#crowd-select');crowdSelect.value=String(n);refreshGlassSelect(crowdSelect);$('#simulation-label').textContent=`${Number(n).toLocaleString('vi-VN')} nhân vật mô phỏng`;if(persist)try{localStorage.setItem('hien-an-crowd',String(n))}catch{}}
 function openRooms(){
  panel('Sân chung · khách thật','leaf','<p>Chọn cùng sân để gặp nhau. Chạm vào một khách trong cảnh 3D để xem tên.</p><div id="room-cards" class="room-cards"></div><button id="room-refresh" class="secondary">Làm mới số khách</button><div id="live-visitors" class="visitor-list"></div><button id="share-current-room" class="secondary">Sao chép đường dẫn sân này</button><button id="room-leave" class="secondary">Rời sân</button><small>Ngoại hình, vị trí và tư thế được chia sẻ. Lời riêng ở lại trên thiết bị.</small>','rooms');
  $('#room-leave').hidden=!hasEntered();
  $('#room-leave').onclick=leaveCourtyard;
  $('#share-current-room').onclick=async()=>{
   const url=new URL(location.href);
   url.searchParams.set('room',getCommunity().room);
   url.searchParams.delete('hen');
   url.searchParams.delete('phut');
   try{await navigator.clipboard.writeText(url.href);toast('Đã sao chép đường dẫn sân chung.')}
   catch{toast('Bạn có thể sao chép đường dẫn trên thanh địa chỉ.')}
  };
  async function refresh(){
   const generation=++roomGeneration;
   const host=$('#room-cards');
   host.textContent='Đang xem số người trong sân…';
   try{
    const r=await fetch('/api/presence/rooms',{cache:'no-store'});
    if(!r.ok)throw Error('Chưa lấy được số người. Hãy thử làm mới.');
    const data=await r.json();
    if(generation!==roomGeneration)return;
    host.replaceChildren();
    for(let i=0;i<ROOMS.length;i++){
     const room=data.rooms.find(r=>r.id===ROOMS[i]);
     const count=room?.count||0, current=getCommunity().room===ROOMS[i]&&hasEntered();
     const button=el('button',undefined,'room-choice');
     button.append(el('strong',ROOM_NAMES[i]),el('span',`${count}/${CAPACITY} khách thật`));
     button.setAttribute('aria-pressed',String(current));
     button.disabled=count>=CAPACITY&&!current;
     button.onclick=()=>{
      if(!current){presence.switchRoom(ROOMS[i]);gatherings.roomChanged(ROOMS[i]);}
      if(!hasEntered())enter();
      const url=new URL(location.href);
      url.searchParams.set('room',ROOMS[i]);
      url.searchParams.delete('hen');
      url.searchParams.delete('phut');
      history.replaceState(null,'',url);
      closePanel();
     };
     host.append(button);
    }
   }catch(error){if(generation===roomGeneration)host.textContent=error.message}
  }
  $('#room-refresh').onclick=refresh;
  updateVisitors();
  refresh();
 }
 function updateVisitors(){if(!isActive('rooms'))return;const host=$('#live-visitors'),data=getCommunity();host.replaceChildren();host.append(el('h3','Đang có mặt'));if(!data.players.length)host.append(el('p','Bạn chưa vào sân hoặc đang kết nối lại.'));for(const p of data.players){host.append(el('p',p.name+(p.id===data.id?' · Bạn':'')+' · '+({idle:'Ngắm cảnh',walk:'Bước đi',greet:'Chắp tay',meditate:'Ngồi yên',prostrate:'Lễ Phật'}[p.pose]||'')))}}
 function open(action){if(action==='prostrate'&&bowLoop){stopBows();return}if(fair.open(action))return;const f={map:mapPanel,oracle:()=>services.openOracle(),offerings:()=>services.openOfferings(),memorial:()=>services.openMemorial(),letters:()=>services.openLetters(),tea,gathering:()=>gatherings.open(),festival,profile:openProfile,prostrate,rooms:openRooms}[action];if(f){if(!['map','profile','rooms','festival','gathering'].includes(action)&&!hasEntered())enter();const destination={oracle:'oracle',offerings:'offerings',memorial:'memorial',tea:'tea',prostrate:'temple'}[action];if(destination){const p=temple.getLocalState(),z=ZONES[destination];if(Math.hypot(p.x-z.point[0],p.z-z.point[1])>15)temple.go(destination)}f()}}
 $('#map-open').onclick=mapPanel;$('#mobile-map').onclick=mapPanel;$('#profile-open').onclick=openProfile;$('#community').onclick=openRooms;$('#camera-follow').onclick=()=>temple.view('follow');$('#festival-open').onclick=festival;$('#crowd-select').onchange=e=>setCrowd(Number(e.target.value));$$('[data-visit]').forEach(b=>b.onclick=()=>visit(b.dataset.visit));$('#welcome-map').onclick=mapPanel;$('#welcome-fair').onclick=()=>visit('market');$('#market-open').onclick=()=>open('market');
 let initial=100;try{const saved=Number(localStorage.getItem('hien-an-crowd'));if([0,100,300,1000].includes(saved)&&localStorage.getItem('hien-an-crowd')!==null)initial=saved}catch{}setCrowd(initial);
 document.addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey||isActive()||!$('#breath-overlay').hidden||!$('#leave-screen').hidden||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.key.toLowerCase()==='m'){e.preventDefault();mapPanel()}if(e.key.toLowerCase()==='c'){e.preventDefault();temple.view('follow')}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopBows();clearInterval(teaTimer)}});
 function onClose(){roomGeneration++;clearInterval(teaTimer);if(preview){preview.dispose();preview=null}profileGeneration++;$('#panel').removeAttribute('data-kind')}
 function tick(now){if(now-lastTick<500)return;lastTick=now;gatherings.update();const p=temple.getLocalState(),zone=nearestZone(p.x,p.z);if(!hasEntered()){$('#zone-name').textContent='Quần thể Hiên An';return}if(zone.id!==lastZone){lastZone=zone.id;$('#scene-location').dataset.current=zone.id;$('#zone-name').textContent=zone.name;$$('[data-visit]').forEach(b=>b.classList.toggle('selected',b.dataset.visit===zone.id))}updateVisitors()}
 return {open,onClose,tick,setCrowd,visit,services,showInvite:gatherings.showInvite,stopBows,resetBows(){stopBows();bowCount=0}};
}
