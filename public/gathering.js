import {clockLabel,GATHERING_LENGTHS,gatheringCalendar,gatheringFrame,gatheringLink,readGathering,regularGathering} from './gathering-time.js';
import {ROOMS} from './world-rules.js?v=pond-parking-1';

export const ROOM_NAMES=['Hiên gió','Bóng trúc','Bên hồ'];
const $=id=>document.getElementById(id);
const time=new Intl.DateTimeFormat('vi-VN',{hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23',timeZone:'Asia/Ho_Chi_Minh'});
export function createGatherings({presence, panel, closePanel, isActive, getCommunity, hasEntered, enter, openGroupBreath, openBreath, toast}){
 let selected, inviteMode=false, regular;
 const getTime=()=>presence.getServerTime();
 const readInvite=query=>readGathering(query,getTime());
 const entry=$('gathering-open');
 function update(){
  if(!isActive('gathering'))return;
  const now=getTime();
  const room=getCommunity().room;
  if(!selected&&(regular?.room!==room||!regular||gatheringFrame(regular,now).stage==='ended'))regular=regularGathering(room,now);
  const gathering=selected??regular;
  const frame=gatheringFrame(gathering,now);
  const title=frame.stage==='active'?'Đang ngồi yên':frame.stage==='ended'?'Cuộc hẹn đã kết thúc':'Bắt đầu sau';
  if($('gathering-title').textContent!==title)$('gathering-title').textContent=title;
  $('gathering-time').textContent=clockLabel(frame.seconds);
  $('gathering-time').dataset.stage=frame.stage;
  $('gathering-detail').textContent=ROOM_NAMES[ROOMS.indexOf(gathering.room)]+' · '+gathering.minutes+' phút · '+time.format(gathering.start)+' giờ Việt Nam';
  const community=getCommunity();
  const seated=community.room===gathering.room&&community.state==='online'
   ? community.players.filter(p=>p.pose==='meditate'&&p.seat?.startsWith('zen:')).length : null;
  $('gathering-guests').textContent=seated===null?'Kết nối sân để xem số khách trong vườn.':seated+' khách đang ngồi trong Vườn thiền';
  $('gathering-join').disabled=frame.stage==='ended';
  $('gathering-join').textContent=frame.stage==='active'?'Tham gia ngay':'Vào vườn chờ cùng nhau';
 }
 function open(invite){
  if(invite){selected=invite;inviteMode=true}
  panel('Hẹn thiền ở Hiên An','breathe',`
   <p class="gathering-intro">Cùng ngồi ở Vườn thiền. Mọi người theo một đồng hồ, kể cả khi đến sau giờ bắt đầu.</p>
   <div class="gathering-clock"><strong id="gathering-title" aria-live="polite"></strong><span id="gathering-time" role="timer"></span></div>
   <p id="gathering-detail"></p><small id="gathering-guests"></small>
   <div class="service-actions"><button id="gathering-join" class="primary">Vào vườn chờ cùng nhau</button>
   <button id="gathering-regular" class="secondary" hidden>Về lịch định kỳ</button></div>
   <div id="gathering-share" hidden><label for="gathering-link">Đường dẫn cuộc hẹn</label>
   <input id="gathering-link" type="url" readonly>
   <div class="service-actions"><button id="gathering-copy" class="secondary">Sao chép link hẹn</button>
   <a id="gathering-calendar" class="secondary" download="hen-thien-hien-an.ics">Lưu vào lịch</a></div></div>
   <details id="gathering-plan"><summary>Tạo cuộc hẹn</summary>
   <form id="gathering-form">
   <label for="gathering-delay">Bắt đầu sau</label><select id="gathering-delay">
   <option value="1">1 phút</option><option value="5">5 phút</option><option value="15">15 phút</option></select>
   <label for="gathering-length">Thời lượng</label><select id="gathering-length">
   ${GATHERING_LENGTHS.map(n=>`<option value="${n}" ${n===3?'selected':''}>${n} phút</option>`).join('')}</select>
   <button class="primary" type="submit">Tạo link hẹn</button></form></details>
   <button id="gathering-own" class="secondary">Ngồi theo nhịp riêng</button>
   <small>Phiên định kỳ mở 5 phút vào mỗi mốc 15 phút. Ai có link hẹn đều có thể tham gia nếu sân còn chỗ.</small>
  `,'gathering');
  const showShare=()=>{
   $('gathering-share').hidden=!selected;
   $('gathering-regular').hidden=!selected;
   if(!selected)return;
   const url=gatheringLink(selected);
   $('gathering-link').value=url;
   $('gathering-calendar').href='data:text/calendar;charset=utf-8,'+encodeURIComponent(gatheringCalendar(selected,url,getTime()));
  };
  $('gathering-join').onclick=()=>{
   const gathering=selected??regular;
   if(gatheringFrame(gathering,getTime()).stage==='ended')return;
   const previousRoom=getCommunity().room, wasEntered=hasEntered();
   closePanel();
   if(!wasEntered)enter();
   if(previousRoom!==gathering.room)presence.switchRoom(gathering.room);
   openGroupBreath(gathering,getTime);
  };
  $('gathering-regular').onclick=()=>{selected=undefined;inviteMode=false;showShare();update()};
  $('gathering-own').onclick=()=>{closePanel();openBreath()};
  $('gathering-copy').onclick=async()=>{
   const input=$('gathering-link');
   try{await navigator.clipboard.writeText(input.value);toast('Đã sao chép link hẹn thiền.')}
   catch{if(input.isConnected){input.focus();input.select()}toast('Link đã được chọn để sao chép.')}
  };
  $('gathering-form').onsubmit=e=>{
   e.preventDefault();
   const delay=Number($('gathering-delay').value), minutes=Number($('gathering-length').value);
   const room=getCommunity().room;
   if(!ROOMS.includes(room)||![1,5,15].includes(delay)||!GATHERING_LENGTHS.includes(minutes))return;
   selected={room,start:Math.ceil(getTime()/1000)*1000+delay*60000,minutes};
   inviteMode=false;
   $('gathering-plan').open=false;
   showShare();update();
   $('gathering-copy').focus();
  };
  showShare();update();
 }
 entry.onclick=()=>open();
 return {open,update,showInvite(query){
  if(!query.has('hen'))return false;
  const invite=readInvite(query);
  if(invite)open(invite);
  else toast('Link hẹn thiền không còn hợp lệ.');
  return true;
 },roomChanged(room){
  if(!inviteMode&&selected?.room!==room)selected=undefined;
 }};
}
