import assert from 'node:assert/strict';
import {setTimeout as wait} from 'node:timers/promises';
import {BODY_DISTANCE,createBodyGrid,steer} from '../public/body-collision.js';
import {HALL_ALTAR,HALL_FISH} from '../public/hall-layout.js';
import {validPosition} from '../public/world-rules.js';
import {findPath,clearSegment} from '../public/pathfinding.js';

const grid=createBodyGrid(),first={x:-1.2,z:87.4},second={x:0,z:87.4};
grid.replace([first,second]);
assert(grid.blocks(first,1.2,87.4),'Swept path crosses the other visitor');
assert(!grid.blocks(first,-1.5,87.4));
assert(steer(first,-1.5,87.4,.2,(x,z)=>grid.blocks(first,x,z)));
grid.move(second,0,89);
assert(!grid.blocks(first,1.2,87.4),'Moving across grid cells updates the footprint');
for(const [x,z] of [[8.55,83],[-5.7,95.8],[-7.5,105],[3.45,110],[HALL_FISH.x,HALL_FISH.z],[HALL_ALTAR.x,HALL_ALTAR.z],[-53,44.6]]){
 assert(!validPosition(x,z),`Scenery footprint at ${x},${z}`);
}
const start={x:5.7,z:65},end={x:12.2,z:65};
assert(!clearSegment(start,end),'Stage blocks the line even with a clear endpoint');
let at=start;
const path=findPath(start,end);
assert(path);
for(const point of path){assert(clearSegment(at,point));at=point}

const base=process.env.HIEN_AN_TEST_URL||'http://127.0.0.1:4387',room='hien-an-03',players=[];
async function post(action,data){
 const response=await fetch(base+'/api/presence/'+action,{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({room,...data}),
  signal:AbortSignal.timeout(10000)
 });
 const payload=await response.json();
 assert.equal(response.status,200,JSON.stringify(payload));
 return payload;
}
async function join(){
 const {id,token,players:list}=await post('join',{travelTo:'market'});
 const player={id,token,seq:0};
 players.push(player);
 return {player,spawn:list.find(p=>p.id===id)};
}
const sync=(p,x,z,travelTo)=>post('sync',{id:p.id,token:p.token,seq:++p.seq,state:{x,z,yaw:0,pose:'walk',travelTo}});
const own=(r,p)=>r.players.find(visitor=>visitor.id===p.id);
try{
 const [a,b]=await Promise.all([join(),join()]);
 assert(Math.hypot(a.spawn.x-b.spawn.x,a.spawn.z-b.spawn.z)>=BODY_DISTANCE);
 await wait(380);
 const [left,right]=await Promise.all([sync(a.player,-1.2,87.4),sync(b.player,1.2,87.4)]);
 assert(!left.corrected&&!right.corrected);
 await wait(400);
 const attempts=await Promise.all([sync(a.player,0,87.4),sync(b.player,0,87.4)]);
 assert.equal(attempts.filter(r=>r.corrected).length,1,'Exactly one player can claim an empty spot');
 const winner=attempts[0].corrected?b.player:a.player,loser=winner===a.player?b.player:a.player;
 const loserX=winner===a.player?1.2:-1.2;
 await wait(420);
 const cross=await sync(loser,-loserX,87.4);
 assert(cross.corrected,'A clear endpoint does not allow walking through a guest');
 assert.equal(own(cross,loser).x,loserX);
 await wait(150);
 const travel=await sync(winner,start.x,start.z,'fair-stage');
 assert.deepEqual([own(travel,winner).x,own(travel,winner).z],[start.x,start.z]);
 await wait(1150);
 const hit=await sync(winner,end.x,end.z);
 assert(hit.corrected,'A clear endpoint does not allow walking through scenery');
 assert.deepEqual([own(hit,winner).x,own(hit,winner).z],[start.x,start.z]);
 console.log('Passed: scenery detour, swept collision, distinct spawns, concurrent destination and blocked crossing.');
}finally{
 await Promise.all(players.map(({id,token})=>post('leave',{id,token})));
}
