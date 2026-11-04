import assert from 'node:assert/strict';
import {setTimeout as wait} from 'node:timers/promises';
import {HALL_ARRIVALS,HALL_DECK,HALL_SEATS,onHallDeck} from '../public/hall-layout.js';
import {BODY_DISTANCE} from '../public/body-collision.js';
import {CAPACITY,validPosition} from '../public/world-rules.js';
import {clearSegment,findPath} from '../public/pathfinding.js';
import {unpackPresence} from '../public/presence-wire.js';

const base=process.env.HIEN_AN_TEST_URL||'http://127.0.0.1:4387';
const room=process.env.HIEN_AN_TEST_ROOM||'hien-an-03';
const sessions=[];
const pointKey=({x,z})=>x+','+z;
const seatsByArrival=new Map(HALL_ARRIVALS.map((point,i)=>[pointKey(point),HALL_SEATS[i]]));

async function post(action,data){
 const response=await fetch(base+'/api/presence/'+action,{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({room,...data}),signal:AbortSignal.timeout(10000)
 });
 return {status:response.status,data:await response.json()};
}
async function occupancy(){
 const response=await fetch(base+'/api/presence/rooms',{signal:AbortSignal.timeout(10000)});
 assert(response.ok);
 return (await response.json()).rooms.find(entry=>entry.id===room).count;
}
async function batch(values,fn){
 for(let i=0;i<values.length;i+=12)await Promise.allSettled(values.slice(i,i+12).map(fn)).then(results=>{
  for(const result of results)if(result.status==='rejected')throw result.reason;
 });
}

assert.equal(seatsByArrival.size,200);
assert.equal(new Set(HALL_SEATS.map(seat=>seat.id)).size,200);
for(const [point,seat] of HALL_ARRIVALS.map((point,i)=>[point,HALL_SEATS[i]])){
 assert(onHallDeck(point.x,point.z)&&onHallDeck(seat.x,seat.z));
 assert(validPosition(point.x,point.z)&&validPosition(seat.x,seat.z));
 assert(clearSegment(point,seat),seat.id);
 assert(findPath({x:0,z:5},seat),seat.id);
}
assert.equal(await occupancy(),0,'Choose an empty room before running the capacity test');
try{
 await batch(HALL_SEATS.slice(0,CAPACITY),async()=>{
  const {status,data}=await post('join',{travelTo:'temple',greetingEvents:true});
  assert.equal(status,200,data.error);
  const {id,token}=data;
  sessions.push({id,token,player:data.players.find(player=>player.id===id)});
 });
 assert.equal(await occupancy(),CAPACITY);
 assert.equal(new Set(sessions.map(({player})=>pointKey(player))).size,CAPACITY);
 for(const [i,{player}] of sessions.entries()){
  assert(seatsByArrival.has(pointKey(player)));
  assert.equal(player.y,HALL_DECK.height);
  for(const {player:other} of sessions.slice(i+1))
   assert(Math.hypot(player.x-other.x,player.z-other.z)>=BODY_DISTANCE);
 }
 const extra=await post('join',{travelTo:'temple'});
 if(extra.status===200)sessions.push(extra.data);
 assert.equal(extra.status,409,'A connection past the room capacity must be refused');
 await wait(150);
 await batch(sessions,async({id,token,player})=>{
  const {id:seat,x,z}=seatsByArrival.get(pointKey(player));
  const {status,data}=await post('sync',{id,token,seq:1,baseSeq:0,basePosition:[player.x,player.z],snapshot:'ack',state:{x,z,yaw:Math.PI,pose:'meditate',seat}});
  assert.equal(status,200,data.error);
  const result=unpackPresence(data);
  assert(!result.corrected,seat);
  assert.equal(result.players[0].seat,seat);
 });
 const {id,token}=sessions[0];
 const {status,data}=await post('observe',{id,token});
 assert.equal(status,200,data.error);
 const observed=unpackPresence(data).players;
 assert.equal(observed.length,CAPACITY);
 assert(observed.every(player=>player.pose==='meditate'&&onHallDeck(player.x,player.z)));
 assert.equal(new Set(observed.map(player=>player.seat)).size,CAPACITY);
 console.log(`${CAPACITY} distinct hall arrivals and simultaneous seat reservations. Guest ${CAPACITY+1} refused.`);
}finally{
 await batch(sessions,({id,token})=>post('leave',{id,token}));
}
