import {validPosition} from './world-rules.js?v=hoi-rong-1';

import {HALL_ARRIVALS} from './hall-layout.js?v=hall-200';

export const BODY_RADIUS=.34;
export const BODY_DISTANCE=BODY_RADIUS*2;
const cell=2;
const key=(x,z)=>x*1024+z;
const cellAt=point=>key(Math.floor(point.x/cell),Math.floor(point.z/cell));

export function createBodyGrid(){
 const cells=new Map();
 function add(body){
  const k=cellAt(body);
  let bucket=cells.get(k);
  if(!bucket)cells.set(k,bucket=new Set());
  bucket.add(body);
 }
 function remove(body){
  const k=cellAt(body),bucket=cells.get(k);
  if(bucket?.delete(body)&&!bucket.size)cells.delete(k);
 }
 function blocks(from,x,z,body=from,radius=body.radius??BODY_RADIUS){
  const dx=x-from.x,dz=z-from.z,step=dx*dx+dz*dz,range=radius+1.5;
  for(let i=Math.floor((Math.min(from.x,x)-range)/cell);i<=Math.floor((Math.max(from.x,x)+range)/cell);i++){
   for(let j=Math.floor((Math.min(from.z,z)-range)/cell);j<=Math.floor((Math.max(from.z,z)+range)/cell);j++){
    const bucket=cells.get(key(i,j));
    if(!bucket)continue;
    for(const other of bucket){
     if(other===body)continue;
     const ox=other.x-from.x,oz=other.z-from.z,gap=radius+(other.radius??BODY_RADIUS);
     const dot=ox*dx+oz*dz;
     // A body already overlapping after a network correction may move out.
     if(dot<=0&&step&&ox*ox+oz*oz<gap*gap)continue;
     const t=step?Math.max(0,Math.min(1,dot/step)):0;
     if((ox-dx*t)**2+(oz-dz*t)**2<gap*gap-1e-8)return true;
    }
   }
  }
  return false;
 }
 function someNear(x,z,radius,test){
  for(let i=Math.floor((x-radius)/cell);i<=Math.floor((x+radius)/cell);i++){
   for(let j=Math.floor((z-radius)/cell);j<=Math.floor((z+radius)/cell);j++){
    const bucket=cells.get(key(i,j));
    if(bucket)for(const body of bucket)if(test(body))return true;
   }
  }
  return false;
 }
 return {add,remove,blocks,someNear,clear:()=>cells.clear(),replace(bodies){
  cells.clear();for(const body of bodies)add(body);
 },move(body,x,z){remove(body);body.x=x;body.z=z;add(body)}};
}

// Try the intended direction first. If blocked, take a short tangential step.
export function steer(body,x,z,step,blocked,preferred=1){
 const dx=x-body.x,dz=z-body.z,distance=Math.hypot(dx,dz);
 if(distance<1e-5)return null;
 const yaw=Math.atan2(dx,dz),length=Math.min(step,distance);
 for(const turn of [0,.66*preferred,-.66*preferred,1.24*preferred,-1.24*preferred,1.65*preferred,-1.65*preferred]){
  const nx=body.x+Math.sin(yaw+turn)*length,nz=body.z+Math.cos(yaw+turn)*length;
  if(validPosition(nx,nz)&&!blocked(nx,nz))return {x:nx,z:nz,yaw:yaw+turn};
 }
 return null;
}

export function destinationPoints(zone,x,z){
 return zone==='temple'?HALL_ARRIVALS:arrivalPoints(x,z,true);
}

export function arrivalPoints(x,z,extended=false){
 const points=[];
 if(validPosition(x,z))points.push({x,z});
 for(const radius of [.84,1.68,2.52]){
  for(let i=0;i<12;i++){
   const nx=x+radius*Math.sin(i*Math.PI/6),nz=z+radius*Math.cos(i*Math.PI/6);
   if(validPosition(nx,nz))points.push({x:nx,z:nz});
  }
 }
 // Add a wider lattice after the usual arrivals, so a crowded gate can spill into the courtyard.
 if(extended){
  const spacing=.86;
  for(let ring=3;ring<=10;ring++){
   for(let offset=-ring;offset<=ring;offset++){
    add(offset,-ring);
    add(offset,ring);
    if(Math.abs(offset)<ring){add(-ring,offset);add(ring,offset)}
   }
  }
  function add(dx,dz){
   const nx=x+dx*spacing,nz=z+dz*spacing;
   if(validPosition(nx,nz))points.push({x:nx,z:nz});
  }
 }
 return points;
}
