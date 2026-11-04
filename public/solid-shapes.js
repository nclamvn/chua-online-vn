import {ARHATS,GALLERY_POSTS,COMPASSION,TAM_THE,TAM_THE_POSTS,REAR_PLANTERS,REAR_LAMPS} from './precinct-layout.js?v=precinct-1';
import {HALL,HALL_DECK,HALL_COLUMNS,HALL_ALTAR,HALL_INCENSE,HALL_FISHES,HALL_CHESTS,HALL_MONKS} from './hall-layout.js?v=hall-200';
import {PARKED_CARS,PARKING_LAMPS,PARKING_SIGN} from './parking-layout.js';
import {FAIR_BUNTING_ROWS,MARKET_CARTS,MARKET_STALLS} from './fair-catalog.js?v=hoi-rong-1';

// Ground-level footprints for scenery. Walkable platforms, roofs and hanging
// decorations are excluded. These dimensions match scene.js, campus.js and fair-scene.js.
const buckets=new Map(),cell=4,padding=.32;
const key=(x,z)=>x*1024+z;
function shape(x,z,hx,hz,r=0){
 const solid={x,z,hx:hx+padding,hz:hz+padding,r:r?r+padding:0};
 for(let ix=Math.floor((x-solid.hx)/cell);ix<=Math.floor((x+solid.hx)/cell);ix++)
  for(let iz=Math.floor((z-solid.hz)/cell);iz<=Math.floor((z+solid.hz)/cell);iz++){
   const k=key(ix,iz);
   if(!buckets.has(k))buckets.set(k,[]);
   buckets.get(k).push(solid);
  }
}
const circle=(x,z,r)=>shape(x,z,r,r,r);
for(const car of PARKED_CARS)shape(car.x,car.z,car.width/2+.11,car.length/2+.08);
for(const [x,z] of PARKING_LAMPS)circle(x,z,.16);
circle(PARKING_SIGN.x,PARKING_SIGN.z,.11);
for(const stall of MARKET_STALLS){
 const side=Math.sign(stall.x);
 if(stall.type==='stage'){shape(stall.x,stall.z,2.05,3);continue}
 shape(stall.x-side*.85,stall.z,.555,2.56);
 for(const dx of [-1.78,1.78])for(const dz of [-2.67,2.67])circle(stall.x+dx,stall.z+dz,.135);
}
for(const {x,z} of MARKET_CARTS){
 shape(x,z,.71,1.09);
 for(const dx of [-.45,.45])shape(x+dx,z-1.47,.05,.48);
}
for(const s of [-1,1]){
 for(const z of FAIR_BUNTING_ROWS)circle(s*8,z,.09);
 for(const z of [97.8,69.2])circle(s*6.3,z,.23);
 circle(s*3.45,110,.08);
 shape(s*7.5,105,.8,.8);
 for(const z of [-11,5,12])shape(s*30.5,z,.52,.52);
 for(const z of [38,45,52,59,66,73,80,87,94]){
  circle(s*61,z,.06);circle(s*31,z,.055);
 }
 for(const z of [-61,-29,3,35,67,99])
  for(const dx of [-3,3])for(const dz of [-11,-5,1,7,12])circle(s*104+dx,z+dz,.18);
}
for(const z of [31,58])for(const x of [38,68])circle(x,z,.17);
for(const x of [-6,-2.5,2.5,6])shape(x,34,.325,.325);
for(const x of [-11,-4,4,11])shape(x*1.3,118,.49,.44);
for(const x of [-49,49]){
 shape(x,-16.5,9,.8);
 for(const dx of [-10,-6,-2,2,6,10])circle(x+dx,-6,.24);
 for(const dx of [-7,7])shape(x+dx,-21.5,1.5,.33);
}
for(const x of [-59,-53,-47])for(const z of [41.4,44.6])shape(x,z,1.15,.325);
for(const x of [-62,-44])for(const z of [36,50])circle(x,z,.22);
for(const x of [51.4,54.6])shape(x,30,.08,.08);
for(const x of [-13,13])for(const z of [-80,-70,-60])circle(x,z,.3);
for(const [x,z,r] of [[34,-2,1.05],[-33,-25,1],[32,-27,1.24],[-36,7,1.2],[36,7,1.3],[-19,-43,1.24],[16,-43,1.4],[-21,9,1.1],[21,10,1],[29,3,.7],[-32,-14,1.15],[-64,-74,1.4],[64,-74,1.55],[-79,86,1.5],[79,86,1.6],[-69,22,1.3],[69,20,1.35],[-45,-132,1.55],[27,-134,1.35],[-67,-119,1.5],[74,-124,1.55],[-41,-174,1.4],[41,-174,1.6]])circle(x,z,r);
circle(-11,9,.75);
for(const [x,z] of HALL_COLUMNS)shape(x,z,1.19,1.35);
const {halfWidth,front,back}=HALL_DECK;
shape(0,back,halfWidth,.38);
for(const side of [-1,1]){
 shape(side*(halfWidth-.23),(front+back)/2,.34,(front-back)/2);
 shape(side*(HALL.stairHalfWidth+halfWidth)/2,front,(halfWidth-HALL.stairHalfWidth)/2,.29);
 shape(side*(HALL.stairHalfWidth+.36),(front+HALL.stairFront)/2,.29,(HALL.stairFront-front)/2+.29);
}
shape(HALL_ALTAR.x,HALL_ALTAR.z,HALL_ALTAR.width/2,HALL_ALTAR.depth/2);
circle(HALL_INCENSE.x,HALL_INCENSE.z,.7);
for(const {x,z,scale} of HALL_FISHES)shape(x,z,.93*scale,.62*scale);
for(const {x,z,width,depth} of HALL_CHESTS)shape(x,z,width/2,depth/2);
for(const {x,z} of HALL_MONKS)circle(x,z,.47);
for(const {x,z} of ARHATS)shape(x,z,1.03,1.13);
for(const [x,z] of GALLERY_POSTS)circle(x,z,.19);
for(const [x,z] of REAR_PLANTERS)shape(x,z,5,1.5);
for(const [x,z] of REAR_LAMPS)circle(x,z,.52);
for(const x of [-7.55,7.55])shape(x,-155.5,.28,2.78);
circle(COMPASSION.x,COMPASSION.z,COMPASSION.radius);
for(const [x,z] of TAM_THE_POSTS)circle(x,z,.31);
for(const x of [-12,0,12])shape(x,TAM_THE.z-2.8,3.4,2.5);
for(const x of [-18,18])shape(x,TAM_THE.z,.23,10);
shape(0,TAM_THE.z-10,18,.23);
for(const x of [-12.5,12.5])shape(x,TAM_THE.z+10,5.5,.28);
export function hitsScenery(x,z){
 const solids=buckets.get(key(Math.floor(x/cell),Math.floor(z/cell)));
 if(!solids)return false;
 for(const s of solids){
  const dx=Math.abs(x-s.x),dz=Math.abs(z-s.z);
  if(s.r?dx*dx+dz*dz<s.r*s.r:dx<s.hx&&dz<s.hz)return true;
 }
 return false;
}
