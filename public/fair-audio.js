import {LION_POINT,BEAT_MS} from './fair-catalog.js';

const calls=[
 {file:'rao-banh',x:-5.7,z:95.8,from:'Xe bánh rong',line:'Bánh nóng đây! Bánh chưng lá dong, mời cô bác ghé ăn nào!'},
 {file:'rao-tra',x:9.4,z:92,from:'Trà & nước mát',line:'Trà sen thơm đây! Nước sấu mát, mời cô bác ghé hàng!'},
 {file:'rao-to-he',x:5.7,z:79,from:'Xe tò he',line:'Tò he đây! Có cá chép, có chim xinh cho các em đây!'},
 {file:'rao-den',x:9.4,z:83,from:'Tiệm đèn giấy',line:'Đèn giấy đây! Đèn cá chép, đèn hoa sen. Mời ghé xem nào!'}
];
const beats=[1,0,0,.62,1,0,.62,.54,1,0,.54,.52,1,0,.54,.7];

export function createFairAudio({audio,master,caption,host}){
 const channels=new Map(),cooldowns=new Map();
 const bed=audio.createGain();
 bed.gain.value=0;bed.connect(master);
 const noise=audio.createBuffer(1,Math.round(audio.sampleRate*.16),audio.sampleRate);
 const samples=noise.getChannelData(0);
 for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.exp(-i/samples.length*7);
 let speaker=null,current=null,nextCall=0,lastBeat=-1,token=0;
 function hide(){
  if(current){current.source.stop();current=null}
  if(speaker){speaker=null;token++}
  caption.hidden=true;delete host.dataset.fairVoice;
 }
 function channelFor(file){
  if(!channels.has(file)){
   const request=fetch('/assets/fair/'+file+'.m4a').then(r=>{
    if(!r.ok)throw Error('Không tải được tiếng rao');
    return r.arrayBuffer();
   }).then(buffer=>audio.decodeAudioData(buffer));
   channels.set(file,request);
   request.catch(()=>channels.delete(file));
  }
  return channels.get(file);
 }
 function panAt(origin,state){
  const dx=origin.x-state.x,dz=origin.z-state.z;
  return Math.max(-.78,Math.min(.78,(dx*Math.cos(state.yaw)-dz*Math.sin(state.yaw))/12));
 }
 function panned(pan){
  const node=audio.createStereoPanner();node.pan.value=pan;node.connect(bed);return node;
 }
 function hit(accent,distance,pan,cymbal){
  const when=audio.currentTime, amp=Math.max(0,1-distance/18)*accent;
  if(amp<.01)return;
  const side=panned(pan),pulse=audio.createOscillator(),env=audio.createGain();
  pulse.type='sine';pulse.frequency.setValueAtTime(138,when);pulse.frequency.exponentialRampToValueAtTime(66,when+.17);
  env.gain.setValueAtTime(.0001,when);env.gain.exponentialRampToValueAtTime(.57*amp,when+.009);env.gain.exponentialRampToValueAtTime(.0001,when+.33);
  pulse.connect(env);env.connect(side);pulse.start(when);pulse.stop(when+.34);
  const rim=audio.createBufferSource(),filter=audio.createBiquadFilter(),tap=audio.createGain();
  rim.buffer=noise;filter.type='bandpass';filter.frequency.value=cymbal?4600:710;filter.Q.value=cymbal?.9:1.2;
  tap.gain.value=amp*(cymbal?.24:.12);
  rim.connect(filter);filter.connect(tap);tap.connect(side);rim.start(when);
  pulse.onended=()=>{pulse.disconnect();env.disconnect();rim.disconnect();filter.disconnect();tap.disconnect();side.disconnect()};
 }
 async function announce(call,state,distance,now){
  speaker=call;
  const request=++token;
  try{
   const buffer=await channelFor(call.file);
   if(request!==token)return;
   const source=audio.createBufferSource(),side=panned(panAt(call,state)),level=audio.createGain();
   source.buffer=buffer;level.gain.value=Math.max(.15,.81*(1-distance/19));
   source.connect(level);level.connect(side);
   current={source};
   caption.querySelector('strong').textContent=call.from;
   caption.querySelector('span').textContent=call.line;
   caption.hidden=false;host.dataset.fairVoice=call.file;
   source.onended=()=>{
    source.disconnect();level.disconnect();side.disconnect();
    if(current?.source!==source)return;
    current=null;speaker=null;caption.hidden=true;delete host.dataset.fairVoice;
   };
   source.start();
  }catch{
   if(request===token)speaker=null;
  }
  cooldowns.set(call.file,now+16000);
 }
 function update({state,now,enabled,volume,count,beat}){
  const here=enabled&&count>0&&state&&Math.abs(state.x)<22&&state.z>=62&&state.z<=111;
  bed.gain.setTargetAtTime(here?Math.min(.54,volume*2.5):0,audio.currentTime,.13);
  if(!here){hide();return}
  if(volume<=.001){hide();return}
  if(beat!==lastBeat){
   lastBeat=beat;
   const accent=beats[beat%beats.length],distance=Math.hypot(LION_POINT.x-state.x,LION_POINT.z-state.z);
   if(accent&&distance<18)hit(accent,distance,panAt(LION_POINT,state),beat%8===0);
  }
  if(speaker||now<nextCall)return;
  const nearby=calls.map(call=>({call,distance:Math.hypot(call.x-state.x,call.z-state.z)}))
   .filter(({call,distance})=>distance<16&&now>=(cooldowns.get(call.file)||0))
   .sort((a,b)=>a.distance-b.distance);
  if(!nearby.length)return;
  nextCall=now+7400;
  announce(nearby[0].call,state,nearby[0].distance,now);
 }
 return {update};
}

export const fairBeat=now=>Math.floor(now/BEAT_MS);
