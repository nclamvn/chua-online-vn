import {GREETING_HEDGE_MS,MOVEMENT_HEDGE_MS,SEAT_HEDGE_MS,sendPresenceWrite} from './presence-write.js?v=seat-2';
import {readPresenceFeed} from './presence-feed.js';
import {unpackPresence} from './presence-wire.js';
import {ROOMS,GREETING_LIMIT,GREETING_WINDOW_MS} from './world-rules.js?v=pond-parking-1';
const SYNC_INTERVAL_MS=350;
const CROWDED_SYNC_INTERVAL_MS=450;
const STREAM_SYNC_INTERVAL_MS=230;
const STREAM_WATCHDOG_MS=4000;
const CROWDED_ROOM=24;
const MIN_START_GAP_MS=145;
const GREETING_PROBE_MS=225;

export function createPresence({temple,onStatus,onChange,room=ROOMS[0]}){
 let session=null,running=false,busy=false,timer,seq=0,failures=0,delay=SYNC_INTERVAL_MS,lastPlayers=[],lastOwn=null,generation=0,serverClock=null,lastStarted=-Infinity,lastSentState=null;
 let seatSyncPending=false;
 let streamController=null,streamActive=false,streamRetryAt=0,streamFailures=0;
 const colors=['#867264','#6d7769','#8d7b69','#70797d','#9b816f'];
 const status=(state,message)=>{
   onChange({state,message,room,players:lastPlayers,id:session?.id});
   const scene=document.querySelector('#scene3d');
   scene.dataset.connection=state;
   scene.dataset.transport=streamActive?'stream':'poll';
 };
 function request(action,body){
   const payload=JSON.stringify({room,...body});
   async function send(cancel){
     const timeout=AbortSignal.timeout(5000);
     const response=await fetch('/api/presence/'+action,{
       method:'POST',headers:{'Content-Type':'application/json'},body:payload,
       signal:cancel?AbortSignal.any([timeout,cancel]):timeout,cache:'no-store'
     });
     const value=await response.json();
     if(!response.ok){
       const error=new Error(value.error||'Mất kết nối');
       error.status=response.status;
       error.code=value.code;
       throw error;
     }
     return value;
   }
   if(action==='greet')return sendPresenceWrite(send,GREETING_HEDGE_MS);
   if(action==='sync'&&body.snapshot==='ack')
     return sendPresenceWrite(send,body.state.pose==='meditate'?SEAT_HEDGE_MS:MOVEMENT_HEDGE_MS);
   return send();
 }
 // Gestures use their own write, so an in-flight movement poll can't swallow a short gesture.
 const greetings=[];
 let greetingTimer,greetingBusy=false;
 function flushGreetings(){
   clearTimeout(greetingTimer);greetingTimer=undefined;
   if(!session||greetingBusy)return;
   while(greetings.length&&performance.now()-greetings[0].queuedAt>=GREETING_WINDOW_MS)greetings.shift();
   const event=greetings[0];
   if(!event)return;
   greetingBusy=true;
   const epoch=generation;
   let retryMs=0;
   request('greet',{...session,eventId:event.id}).then(ack=>{
     if(ack.eventId!==event.id)throw new Error('Chưa xác nhận chắp tay.');
     if(epoch===generation)greetings.shift();
   }).catch(error=>{
     if(epoch!==generation)return;
     event.attempts++;
     if(error.status===400||event.attempts>=5)greetings.shift();
     else retryMs=Math.min(1200,220*2**(event.attempts-1));
   }).finally(()=>{
     if(epoch!==generation)return;
     greetingBusy=false;
     if(greetings.length)greetingTimer=setTimeout(flushGreetings,retryMs);
   });
 }
 function greet(){
   if(!running||greetings.length>=GREETING_LIMIT)return;
   greetings.push({id:crypto.randomUUID(),queuedAt:performance.now(),attempts:0});
   if(!greetingTimer&&!greetingBusy)flushGreetings();
 }
 let greetingReadEpoch=null;
 function readGreetings(){
   if(!session||streamActive||greetingReadEpoch!==null||document.hidden||lastPlayers.length<2)return;
   const epoch=generation;
   greetingReadEpoch=epoch;
   request('greetings',session).then(({players})=>{
     if(epoch===generation)temple.receiveGreetings(players);
   }).catch(()=>{
     // The regular sync still delivers retained events when the probe fails.
   }).finally(()=>{
     if(greetingReadEpoch===epoch)greetingReadEpoch=null;
   });
 }
 function observeClock(serverTime,started){
  const received=performance.now();
  if(!Number.isFinite(serverTime)||started<(serverClock?.started??-Infinity))return;
  const estimate=serverTime+(received-started)/2;
  const previous=serverClock&&serverClock.time+received-serverClock.at;
  const time=previous===null||Math.abs(estimate-previous)>1000?estimate:previous+(estimate-previous)*.2;
  serverClock={time,at:received,started};
 }
 async function refreshClock(){
  const started=performance.now();
  const response=await fetch('/api/presence/rooms',{cache:'no-store',signal:AbortSignal.timeout(3500)});
  if(response.ok)observeClock((await response.json()).serverTime,started);
 }
 function acceptOwn(me,sentTravel,corrected){
   if(me&&(!lastOwn||me.seq>=lastOwn.seq))lastOwn=me;
   if(me&&corrected&&temple.getLocalState().travelTo===sentTravel)temple.reconcile(me);
 }
 function showRoster(players,serverTime,streamed){
   lastPlayers=players;
   const maxAge=players.length>CROWDED_ROOM?8500:5500;
   temple.setParticipants(players.filter(p=>p.id!==session.id&&(streamed||serverTime-p.updatedAt<maxAge))
     .map(p=>({...p,color:colors[parseInt(p.id.slice(0,2),16)%colors.length]})));
   status('online',`${lastPlayers.length} người trong sân`);
 }
 function apply(payload,sentTravel,started,ackOnly=false){
   observeClock(payload.serverTime,started);
   acceptOwn(payload.players.find(p=>p.id===session.id),sentTravel,payload.corrected);
   if(!streamActive&&!ackOnly)showRoster(payload.players,payload.serverTime,false);
 }
 function closeStream(){
   streamController?.abort();
   streamController=null;
   streamActive=false;
 }
 function openStream(){
   if(!session||lastPlayers.length<=CROWDED_ROOM||streamController||performance.now()<streamRetryAt)return;
   const controller=new AbortController(),players=new Map();
   streamController=controller;
   let watchdog=setTimeout(()=>controller.abort(),STREAM_WATCHDOG_MS);
   readPresenceFeed('/api/presence/stream',{room,...session},controller.signal,frame=>{
     if(streamController!==controller)return;
     clearTimeout(watchdog);
     watchdog=setTimeout(()=>controller.abort(),STREAM_WATCHDOG_MS);
     if(!frame.players){
       if(streamActive)showRoster([...players.values()],frame.serverTime,true);
       return;
     }
     if(frame.full)players.clear();
     for(const id of frame.left??[])players.delete(id);
     for(const player of frame.players)players.set(player.id,player);
     streamActive=true;
     streamFailures=0;
     acceptOwn(players.get(session.id),null,false);
     showRoster([...players.values()],frame.serverTime,true);
   }).catch(()=>{}).finally(()=>{
     clearTimeout(watchdog);
     if(streamController!==controller)return;
     const wasActive=streamActive;
     closeStream();
     streamFailures=wasActive?0:streamFailures+1;
     streamRetryAt=performance.now()+Math.min(15000,600*2**Math.min(5,streamFailures))+Math.random()*500;
     if(running&&!busy)schedule(0);
   });
 }
 async function tick(){
   if(!running||busy)return;
   const cycleStarted=performance.now();
   // Pace request starts. A slow response already used up the polling interval.
   const wait=MIN_START_GAP_MS-(cycleStarted-lastStarted);
   if(wait>0){schedule(wait);return}
   schedule(0,true);
   busy=true;
   lastStarted=cycleStarted;
   const epoch=generation;
   let greetingProbe;
   try{
     if(!session){
       status('connecting','Đang vào sân chung…');
       const travelTo=temple.getLocalState().travelTo;
       const joined=await request('join',{appearance:temple.getAppearance?.(),travelTo,greetingEvents:true});
       if(epoch!==generation){
         fetch('/api/presence/leave',{method:'POST',headers:{'Content-Type':'application/json'},
           body:JSON.stringify({room:joined.room,id:joined.id,token:joined.token}),keepalive:true}).catch(()=>{});
         return;
       }
       session={id:joined.id,token:joined.token};
       seq=0;
       if(temple.getLocalState().travelTo===travelTo){
         temple.reconcile(joined.players.find(p=>p.id===joined.id),{resumeRoute:true});
       }
       apply(joined,travelTo,cycleStarted);
       openStream();
       flushGreetings();
     }else{
       openStream();
       const started=performance.now(),state=temple.getLocalState(),serialized=JSON.stringify(state);
       seatSyncPending=false;
       const observing=!state.travelTo&&serialized===lastSentState;
       const ackOnly=streamActive;
       if(!(ackOnly&&observing)){
         if(!ackOnly&&!document.hidden&&lastPlayers.length>1&&lastPlayers.length<=CROWDED_ROOM){
           greetingProbe=setTimeout(()=>{if(epoch===generation)readGreetings()},GREETING_PROBE_MS);
         }
         const payload=unpackPresence(await (observing?request('observe',session):request('sync',{
           ...session,seq:++seq,baseSeq:lastOwn?.seq,state,snapshot:ackOnly?'ack':'compact',
           basePosition:ackOnly&&!state.travelTo&&lastOwn?[lastOwn.x,lastOwn.z]:undefined
         })));
         if(epoch!==generation)return;
         if(!observing)lastSentState=payload.corrected?null:serialized;
         document.querySelector('#scene3d').dataset.networkMs=Math.round(performance.now()-started);
         apply(payload,state.travelTo,started,ackOnly);
       }
     }
     failures=0;
     delay=lastPlayers.length>CROWDED_ROOM?CROWDED_SYNC_INTERVAL_MS:SYNC_INTERVAL_MS;
 }catch(e){if(epoch!==generation)return;if(e.status===401){closeStream();session=null;lastOwn=null;lastSentState=null;status('connecting','Đang vào lại sân…')}
 else if(e.status===429){delay=SYNC_INTERVAL_MS}
 else if(e.code==='SEAT_TAKEN'){temple.stand();onStatus(e.message)}
 else if(e.status===400){if(lastOwn)temple.reconcile(lastOwn);else temple.stand();delay=1500;status('offline',e.message)}
 else{failures++;delay=Math.min(10000,600*2**Math.min(failures,4));if(!streamActive){temple.setParticipants([]);status('offline',e.message||'Kết nối gián đoạn; đang thử lại.')}if(e.status===409&&!session)running=false}
 }finally{
   clearTimeout(greetingProbe);
   if(epoch===generation){
     busy=false;
     if(running){
       const interval=document.hidden?Math.max(1800,delay):streamActive&&failures===0?STREAM_SYNC_INTERVAL_MS:delay;
       schedule(seatSyncPending?0:Math.max(0,interval-(performance.now()-cycleStarted)));
     }
   }
 }
 }
 function schedule(ms,clear=false){clearTimeout(timer);if(!clear)timer=setTimeout(tick,ms)}
 function leave(){generation++;closeStream();streamFailures=0;streamRetryAt=0;busy=false;lastStarted=-Infinity;greetingReadEpoch=null;clearTimeout(greetingTimer);greetingTimer=undefined;greetingBusy=false;greetings.length=0;if(session){const payload=JSON.stringify({room,...session});navigator.sendBeacon?.('/api/presence/leave',new Blob([payload],{type:'application/json'}));}session=null;seq=0;lastOwn=null;lastSentState=null;seatSyncPending=false;lastPlayers=[];temple.setParticipants([])}
 function syncSeat(){
  if(!running)return;
  seatSyncPending=true;
  if(!busy)schedule(0);
 }
 return {greet,syncSeat,refreshClock,getServerTime:()=>serverClock?serverClock.time+performance.now()-serverClock.at:Date.now(),start(){if(running)return;running=true;status('connecting','Đang vào sân chung…');tick()},switchRoom(next){if(!ROOMS.includes(next))return;leave();room=next;running=true;busy=false;failures=0;tick()},stop(){running=false;clearTimeout(timer);leave();status('offline','Đã rời sân chung')},wake(){if(running)schedule(160)}};
}
