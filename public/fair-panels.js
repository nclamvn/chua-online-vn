import {MARKET_STALLS} from './fair-catalog.js?v=hoi-rong-1';

const $=selector=>document.querySelector(selector);
const storageKey='hien-an-fair-passes';
const souvenirWords={An:'Thảnh thơi giữa một ngày dài',Nhẫn:'Chậm lại trước khi đáp lời',Tâm:'Giữ lòng mình rộng mở',Hòa:'Tìm điều có thể cùng nhau'};

function saved(){
 try{
  const list=JSON.parse(localStorage.getItem(storageKey)||'[]');
  return Array.isArray(list)?list.filter(item=>typeof item==='string'):[];
 }catch{return []}
}
function download(blob,name){
 if(!blob)return false;
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=name;link.click();
 setTimeout(()=>URL.revokeObjectURL(url),10000);
 return true;
}
function makePrint(word){
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=1200;
 const c=canvas.getContext('2d');
 c.fillStyle='#f3e6c8';c.fillRect(0,0,960,1200);
 c.strokeStyle='#874233';c.lineWidth=4;c.strokeRect(52,52,856,1096);
 c.strokeStyle='#b88653';c.lineWidth=1;c.strokeRect(66,66,828,1068);
 c.textAlign='center';c.fillStyle='#874233';c.font='30px Georgia';c.fillText('PHỐ HỘI TAM QUAN',480,187);
 c.fillStyle='#342920';c.font='italic 270px Georgia';c.fillText(word,480,610,790);
 c.fillStyle='#6d5845';c.font='33px Georgia';c.fillText(souvenirWords[word],480,756,740);
 c.fillStyle='#874233';c.font='25px Georgia';c.fillText('SẠP XIN CHỮ · HIÊN AN',480,1026);
 canvas.toBlob(blob=>download(blob,'hien-an-chu-'+word.toLowerCase()+'.png'));
}
export function createFairPanels({panel,toast,visit,temple,openProfile,showPerformance,enableFairSound,openOracle}){
 function openGuide(){
  panel('Phố hội tam quan','market','<div class="fair-intro"><span>HIÊN AN · NGOÀI TAM QUAN</span><p>Ghé xe hàng rong, chọn vé kỷ niệm hoặc xin một quẻ. Múa lân và đoàn Tây Du Ký đi qua giữa phố.</p></div><div class="fair-program"><button id="fair-lion" class="primary">Xem múa lân</button><button id="fair-parade" class="primary">Theo đoàn Tây Du Ký</button><button id="fair-audio" class="secondary">Bật âm thanh phố hội</button></div><div id="fair-directory" class="fair-directory"></div><button id="fair-album" class="secondary">Mở sổ hội</button><button id="fair-visit" class="primary">Ra giữa phố hội</button>','market');
  for(const stall of MARKET_STALLS){
   const button=document.createElement('button');
   button.className='fair-directory-item';button.style.setProperty('--stall-color',stall.color);
   const name=document.createElement('strong'),note=document.createElement('span');
   name.textContent=stall.name;note.textContent=stall.description;
   button.append(name,note);button.onclick=()=>openStall(stall);$('#fair-directory').append(button);
  }
  $('#fair-visit').onclick=()=>visit('market');
  $('#fair-album').onclick=openAlbum;
  $('#fair-lion').onclick=()=>showPerformance('lion');
  $('#fair-parade').onclick=()=>showPerformance('parade');
  $('#fair-audio').onclick=()=>{visit('market');enableFairSound()};
 }
 function openAlbum(){
  panel('Sổ hội của bạn','ticket','<p>Những món bạn đã chọn ở phố hội. Sổ lưu trên trình duyệt này.</p><ul id="fair-saved" class="fair-saved"></ul><button class="secondary" id="fair-back">Các sạp hàng</button>','fair-album');
  const collected=saved();
  const items=MARKET_STALLS.flatMap(s=>(s.items||[]).filter((_,i)=>collected.includes(s.id+':'+i)));
  for(const name of items.length?items:['Sổ còn trống. Hãy ghé một sạp và chọn món.']){
   const item=document.createElement('li');item.textContent=name;$('#fair-saved').append(item);
  }
  $('#fair-back').onclick=openGuide;
 }
 function openStall(stall){
  panel(stall.name,'market',`<div class="fair-intro" style="--stall-color:${stall.color}"><span>PHỐ HỘI TAM QUAN</span><p>${stall.description}</p></div><div class="fair-stall-actions" id="fair-stall-actions"></div><button class="secondary" id="fair-back">Các sạp hàng</button>`,stall.id);
  const buttons=$('#fair-stall-actions');
  function addButton(label,handler,className='primary'){
   const button=document.createElement('button');
   button.className=className;button.textContent=label;button.onclick=handler;buttons.append(button);
   return button;
  }
  if(stall.type==='costumes'){
   addButton('Mở tủ hóa trang',()=>openProfile(4));
  }else if(stall.type==='fortune'){
   if(!stall.items.length)addButton('Gieo quẻ đồng xu',openOracle);
   else{
    const result=document.createElement('p');
    result.className='service-note';result.setAttribute('aria-live','polite');
    const deck=[...stall.items];
    addButton(stall.id==='fair-fortune-bamboo'?'Rút một thẻ tre':'Rút một thẻ hoa',()=>{
     if(!deck.length)deck.push(...stall.items);
     const [card]=deck.splice(Math.floor(Math.random()*deck.length),1);
     result.textContent=card;
    });
    buttons.append(result);
   }
   const note=document.createElement('small');
   note.textContent='Lời gợi mở để chiêm nghiệm.';
   buttons.append(note);
  }else if(stall.type==='stage'){
   addButton('Xem múa lân',()=>showPerformance('lion'));
   addButton('Theo đoàn Tây Du Ký',()=>showPerformance('parade'));
   addButton('Đến gần sân diễn',()=>visit('fair-stage'),'secondary');
   addButton('Tải ảnh cảnh 3D hiện tại',async()=>{
    try{
     if(!download(await temple.captureFrame(),'hien-an-pho-hoi.png'))throw Error();
     toast('Đã tải ảnh phố hội.');
    }catch{toast('Chưa chụp được ảnh. Hãy thử lại khi cảnh 3D đã tải xong.')}
   },'secondary');
  }else{
   stall.items.forEach((name,i)=>{
    const id=stall.id+':'+i;
    const button=addButton(stall.type==='letters'?'Xin chữ '+name:name,()=>{
     const list=saved();
     if(!list.includes(id)){
      try{localStorage.setItem(storageKey,JSON.stringify([...list,id]));toast('Đã ghi '+name+' vào sổ hội.')}
      catch{toast('Trình duyệt đang chặn lưu sổ hội.')}
     }else toast('Món này đã có trong sổ hội.');
     if(stall.type==='letters')makePrint(name);
     button.setAttribute('aria-pressed',String(saved().includes(id)));
    },'fair-pick');
    button.setAttribute('aria-pressed',String(saved().includes(id)));
   });
   const note=document.createElement('small');note.textContent=stall.type==='lottery'?'Vé kỷ niệm miễn phí để lưu trong sổ hội.':'Quà hội mô phỏng, miễn phí.';buttons.append(note);
   addButton('Mở sổ hội',openAlbum,'secondary');
  }
  $('#fair-back').onclick=openGuide;
 }
 return {open(action){
  if(action==='market'){openGuide();return true}
  const stall=MARKET_STALLS.find(s=>s.id===action);
  if(!stall)return false;
  openStall(stall);return true;
 }};
}
