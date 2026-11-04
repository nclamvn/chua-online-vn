import {GREETING_HEDGE_MS,MOVEMENT_HEDGE_MS,SEAT_HEDGE_MS,sendPresenceWrite} from '../public/presence-write.js';
import {readPresenceFeed} from '../public/presence-feed.js';
import {unpackPresence} from '../public/presence-wire.js';
import assert from 'node:assert/strict';
import {setTimeout as wait} from 'node:timers/promises';
import {HALL_ARRIVALS,HALL_SEATS,onHallDeck} from '../public/hall-layout.js';
import {CAPACITY,validPosition} from '../public/world-rules.js';
import {BODY_DISTANCE} from '../public/body-collision.js';
import {clearSegment} from '../public/pathfinding.js';

const base=process.env.HIEN_AN_TEST_URL||'http://127.0.0.1:4387';
const room=process.env.HIEN_AN_TEST_ROOM||'hien-an-03';
const clients=Number(process.env.HIEN_AN_CLIENTS||CAPACITY);
const travelTo=process.env.HIEN_AN_TEST_ZONE;
const observer=process.env.HIEN_AN_OBSERVER==='1';
const requestedMovers=Number(process.env.HIEN_AN_MOVERS||clients);
const seconds=Number(process.env.HIEN_AN_TEST_SECONDS||42);
const streaming=process.env.HIEN_AN_TEST_STREAM!=='0';
const transportDelay=Number(process.env.HIEN_AN_TEST_RTT||0)/2;
const interval=streaming?230:450;
const sessions=[];
const codes={},errors={};
const responseTimes=[],movement=[],greeting=[],acks=[];
const events=new Map(),moves=new Map(),seatings=new Map();
const meditation=[],meditationAcks=[];
const seatByOrigin=new Map(HALL_ARRIVALS.map(({x,z},i)=>[x+','+z,HALL_SEATS[i]]));
let stop=false,received=0,blocked=0,attempts=0;
const now=()=>performance.now();
async function post(action,data){
 const started=now();
 const body=JSON.stringify({room,...data});
 async function send(cancel){
  if(transportDelay)await wait(transportDelay,undefined,{signal:cancel});
  const timeout=AbortSignal.timeout(6000);
  const response=await fetch(base+'/api/presence/'+action,{
   method:'POST',headers:{'Content-Type':'application/json'},body,
   signal:cancel?AbortSignal.any([timeout,cancel]):timeout
  });
  const payload=await response.json();
  if(transportDelay)await wait(transportDelay,undefined,{signal:cancel});
  if(!response.ok)throw Object.assign(new Error(payload.error),{status:response.status,payload});
  return {status:response.status,data:payload,ms:now()-started};
 }
 try{
  if(streaming&&action==='greet')return await sendPresenceWrite(send,GREETING_HEDGE_MS);
  if(streaming&&action==='sync')return await sendPresenceWrite(send,data.state.pose==='meditate'?SEAT_HEDGE_MS:MOVEMENT_HEDGE_MS);
  return await send();
 }catch(error){
  return {status:error.status||0,data:error.payload??{error:error.cause?.code||error.name},ms:now()-started};
 }
}
async function occupancy(){
 const response=await fetch(base+'/api/presence/rooms',{signal:AbortSignal.timeout(6000)});
 assert(response.ok);
 return (await response.json()).rooms.find(entry=>entry.id===room);
}
function stats(values){
 if(!values.length)return {n:0};
 const sorted=[...values].sort((a,b)=>a-b);
 const at=q=>Math.round(sorted[Math.ceil(sorted.length*q)-1]);
 return {n:sorted.length,p50:at(.5),p95:at(.95),p99:at(.99),max:at(1)};
}
function observe(player,listener,at){
 if(player.id===listener.id)return;
 for(const event of player.greetings??[]){
  const record=events.get(event.id);
  if(record&&!record.seen.has(listener.id)){
   record.seen.add(listener.id);
   greeting.push(at-record.at);
  }
 }
 const seating=seatings.get(player.id);
 if(seating&&player.pose==='meditate'&&player.seat===seating.seat&&!seating.seen.has(listener.id)){
  seating.seen.add(listener.id);
  meditation.push(at-seating.at);
 }
 const activeMove=moves.get(player.id);
 if(activeMove&&!activeMove.seen.has(listener.id)&&at-activeMove.at<=2400&&player.seq>=activeMove.seq&&Math.hypot(player.x-activeMove.x,player.z-activeMove.z)<.025){
  activeMove.seen.add(listener.id);
  movement.push(at-activeMove.at);
 }
}
function receiveFeed(frame,session){
 if(!frame.players)return;
 if(frame.full){
  session.feedReady=true;
  session.liveIds.clear();
 }
 for(const id of frame.left??[])session.liveIds.delete(id);
 for(const player of frame.players)session.liveIds.add(player.id);
 if(!recording)return;
 const at=now();
 received=Math.max(received,session.liveIds.size);
 for(const player of frame.players)observe(player,session,at);
}
async function feed(session){
 const {id,token}=session;
 if(transportDelay)await wait(transportDelay);
 while(!feedAbort.signal.aborted){
  const controller=new AbortController();
  const signal=AbortSignal.any([feedAbort.signal,controller.signal]);
  let watchdog=setTimeout(()=>controller.abort(),5000);
  try{
   await readPresenceFeed(base+'/api/presence/stream',{room,id,token},signal,frame=>{
    clearTimeout(watchdog);
    watchdog=setTimeout(()=>controller.abort(),5000);
    if(transportDelay)setTimeout(()=>{if(!signal.aborted)receiveFeed(frame,session)},transportDelay);
    else receiveFeed(frame,session);
   });
  }catch(error){
   if(!feedAbort.signal.aborted){
    const reason='Stream: '+error.message;
    errors[reason]=(errors[reason]||0)+1;
   }
  }finally{
   clearTimeout(watchdog);
   session.feedReady=false;
  }
  if(!feedAbort.signal.aborted){
   await post('observe',{id,token});
   await wait(250+Math.random()*300);
  }
 }
}
function recordResponse(result,session,target){
 if(result.status===200){
  result.data=unpackPresence(result.data);
  const self=result.data.players.find(p=>p.id===session.id);
  if(self)session.baseSeq=Math.max(session.baseSeq,self.seq);
  if(self)session.basePosition=[self.x,self.z];
  if(!result.data.corrected)session.lastTarget=target;
 }
 if(!recording)return;
 attempts++;
 codes[result.status]=(codes[result.status]||0)+1;
 if(result.status!==200){
  const reason=result.data.code||result.data.error||result.status;
  errors[reason]=(errors[reason]||0)+1;
  return;
 }
 responseTimes.push(result.ms);
 if(result.data.corrected)blocked++;
 if(!streaming){
  received=Math.max(received,result.data.players.length);
  const at=now();
  for(const player of result.data.players)observe(player,session,at);
 }
}
async function loop(session,index){
 await wait(index%25*17);
 while(!stop){
  const started=now();
  const destination=session.destination??session.origin;
  const seq=++session.seq;
  const sampled=session.sample&&destination!==session.origin&&session.lastTarget!==destination;
  if(sampled){
   moves.set(session.id,{seq,x:destination.x,z:destination.z,at:started,seen:new Set()});
   session.sample=false;
   session.holdUntil=started+2200;
  }
  const moving=sampled||started<session.holdUntil||seq%2===0;
  const target=moving?destination:session.origin;
  const {x,z}=target;
  if(streaming&&target===session.lastTarget){await wait(Math.max(5,interval-(now()-started)));continue}
  const identity={id:session.id,token:session.token};
  const result=session.destination
   ? await post('sync',{...identity,seq,baseSeq:session.baseSeq,basePosition:session.basePosition,snapshot:streaming?'ack':'compact',state:{x,z,yaw:0,pose:moving?'walk':'idle'}})
   : await post('observe',identity);
  recordResponse(result,session,target);
  await wait(Math.max(5,interval-(now()-started)));
 }
}
let loops=[],feeds=[],recording=false;
const feedAbort=new AbortController();
function distanceToPath(point,start,end){
 const dx=end.x-start.x,dz=end.z-start.z,length=dx*dx+dz*dz;
 const t=length?Math.max(0,Math.min(1,((point.x-start.x)*dx+(point.z-start.z)*dz)/length)):0;
 return Math.hypot(point.x-start.x-t*dx,point.z-start.z-t*dz);
}
function pathsSeparate(a,b,c,d){
 const side=(start,end,point)=>(end.x-start.x)*(point.z-start.z)-(end.z-start.z)*(point.x-start.x);
 if(side(a,b,c)*side(a,b,d)<0&&side(c,d,a)*side(c,d,b)<0)return false;
 return Math.min(distanceToPath(a,c,d),distanceToPath(b,c,d),distanceToPath(c,a,b),distanceToPath(d,a,b))>BODY_DISTANCE+.015;
}
try{
 const current=await occupancy();
 assert.equal(current.count,0,'Test room must be empty.');
 assert.equal(current.capacity,CAPACITY,'Room capacity differs from the checkout.');
 for(let offset=0;offset<clients;offset+=8){
  const joins=await Promise.all(Array.from({length:Math.min(8,clients-offset)},()=>post('join',{greetingEvents:true,travelTo})));
  for(const join of joins){
   if(join.status!==200)continue;
   const origin=join.data.players.find(player=>player.id===join.data.id);
   const session={id:join.data.id,token:join.data.token,origin,seq:0,baseSeq:0,basePosition:[origin.x,origin.z],sample:false,holdUntil:0,feedReady:false,liveIds:new Set()};
   sessions.push(session);
   if(streaming)feeds.push(feed(session));
  }
  assert(joins.every(join=>join.status===200),JSON.stringify(joins.map(join=>({status:join.status,error:join.data.error}))));
 }
 assert.equal(new Set(sessions.map(({origin})=>[origin.x,origin.z].join(','))).size,clients);
 assert.equal((await occupancy()).count,clients);
 if(clients===current.capacity&&!observer){
  const extra=await post('join',{greetingEvents:true});
  if(extra.status===200)sessions.push(extra.data);
  assert.equal(extra.status,409,'A guest above room capacity must be rejected.');
 }
 if(travelTo==='temple')assert(sessions.every(({origin})=>onHallDeck(origin.x,origin.z)));
 let assigned=0;
 for(const session of sessions){
  if(assigned>=requestedMovers)break;
  const {origin}=session;
  const offsets=[.52,.24,.10].flatMap(distance=>[[distance,0],[-distance,0],[0,distance],[0,-distance]]);
  session.destination=offsets.map(([dx,dz])=>({x:origin.x+dx,z:origin.z+dz})).find(point=>
   validPosition(point.x,point.z)&&clearSegment(origin,point)&&
   sessions.every(peer=>peer===session||pathsSeparate(origin,point,peer.origin,peer.destination??peer.origin)));
  if(session.destination)assigned++;
 }
 const movers=sessions.filter(session=>session.destination);
 assert(movers.length>=20,'Expected twenty guests with room to move.');
 if(streaming){
  const deadline=now()+15000;
  while(sessions.some(session=>!session.feedReady)&&now()<deadline)await wait(80);
  assert(sessions.every(session=>session.feedReady),JSON.stringify({message:'All clients must receive an initial stream snapshot.',ready:sessions.filter(session=>session.feedReady).length,errors}));
 }
 loops=sessions.filter(session=>!streaming||session.destination).map(loop);
 await wait(interval*2);
 console.log('READY '+JSON.stringify({room,clients,seconds,base,observer}));
 if(observer){
  const deadline=now()+40000;
  while((await occupancy()).count!==clients+1&&now()<deadline)await wait(350);
  assert.equal((await occupancy()).count,clients+1,'Expected a browser observer in the same room.');
  if(clients+1===current.capacity){
   const extra=await post('join',{greetingEvents:true});
   if(extra.status===200)sessions.push(extra.data);
   assert.equal(extra.status,409,'A guest above room capacity must be rejected.');
  }
 }
 recording=true;
 const start=now();
 const pending=[];
 const meditators=travelTo==='temple'&&streaming?sessions.filter(s=>!s.destination).slice(0,20):[];
 if(travelTo==='temple'&&streaming)assert.equal(meditators.length,20,'Reserve 20 stationary guests to measure seating.');
 for(let i=0;i<20;i++){
  const session=movers[Math.floor(i*movers.length/20)];
  const eventId=crypto.randomUUID();
  events.set(eventId,{at:now(),seen:new Set()});
  session.sample=true;
  pending.push(post('greet',{id:session.id,token:session.token,eventId}).then(r=>{if(r.status===200)acks.push(r.ms)}));
  const sitter=meditators[i];
  if(sitter){
   const {x,z}=sitter.origin;
   const seat=seatByOrigin.get(x+','+z);
   assert(seat,'Expected a designated hall arrival for meditation.');
   seatings.set(sitter.id,{seat:seat.id,at:now(),seen:new Set()});
   const state={x:seat.x,z:seat.z,yaw:Math.PI,pose:'meditate',seat:seat.id};
   pending.push(post('sync',{id:sitter.id,token:sitter.token,seq:++sitter.seq,baseSeq:sitter.baseSeq,basePosition:[x,z],snapshot:'ack',state}).then(result=>{
    if(result.status===200&&!result.data.corrected)meditationAcks.push(result.ms);
   }));
  }
  await wait(seconds*1000/21);
 }
 await wait(Math.max(0,seconds*1000-(now()-start)));
 await Promise.all(pending);
 await wait(2500);
 recording=false;
 const report={
  base,room,travelTo,clients,movers:movers.length,seconds,streaming,simulatedRttMs:transportDelay*2,peakSnapshot:received,attempts,codes,errors,collisionCorrections:blocked,
  syncRoundTripMs:stats(responseTimes),movementObservedMs:stats(movement),greetingAckMs:stats(acks),
  greetingObservedMs:stats(greeting),meditationObservedMs:stats(meditation),meditationAckMs:stats(meditationAcks),
  meditationDeliveries:{acknowledged:meditationAcks.length,received:meditation.length,expected:meditators.length*(clients-1),within1000:meditation.filter(t=>t<1000).length},
  greetingDeliveries:{received:greeting.length,expected:20*(clients-1),within1000:greeting.filter(t=>t<1000).length},
  movementDeliveries:{received:movement.length,expected:20*(clients-1),within1000:movement.filter(t=>t<1000).length},
  movementSamples:[...moves.values()].map(move=>move.seen.size)
 };
 console.log(JSON.stringify(report,null,2));
 assert.equal(meditationAcks.length,meditators.length,'Every meditation reservation must succeed.');
 assert.equal(meditation.length,meditators.length*(clients-1),'Every other listener must see the meditation pose and seat.');
 if(meditators.length)assert(stats(meditation).p95<1000,'Meditation p95 must stay below one second.');
 assert.equal(acks.length,20,'All greeting sends must succeed.');
 assert(received>=clients,'A full snapshot must reach the clients.');
 assert((codes[200]||0)/attempts>=.99,'Sync must succeed at least 99% of the time.');
 assert(greeting.filter(t=>t<1000).length>=.9*20*(clients-1),'At least 90% of greeting deliveries must arrive within one second.');
 assert(movement.filter(t=>t<1000).length>=.95*20*(clients-1),'Movement p95 must stay below one second, including missing samples.');
}finally{
 stop=true;
 feedAbort.abort();
 await Promise.all([...loops,...feeds]);
 for(let i=0;i<sessions.length;i+=12)await Promise.all(sessions.slice(i,i+12).map(({id,token})=>post('leave',{id,token})));
 console.log('Test sessions cleaned up.');
}
