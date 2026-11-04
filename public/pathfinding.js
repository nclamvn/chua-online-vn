import {validPosition} from './world-rules.js?v=hoi-rong-1';
const STEP=.5;
const SEARCH_LIMIT=32000;
export function clearSegment(a,b){const d=Math.hypot(a.x-b.x,a.z-b.z),n=Math.ceil(d/.18);for(let i=1;i<=n;i++)if(!validPosition(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true}
export function findPath(start,end){
 if(!validPosition(end.x,end.z))return null;if(clearSegment(start,end))return [end];
 const key=(x,z)=>`${x},${z}`;
 function snap(point,reverse=false){
  const x=Math.round(point.x/STEP),z=Math.round(point.z/STEP),candidates=[];
  for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++){
   const gx=x+dx,gz=z+dz,world={x:gx*STEP,z:gz*STEP};
   if(!validPosition(world.x,world.z))continue;
   if(reverse?!clearSegment(world,point):!clearSegment(point,world))continue;
   candidates.push({x:gx,z:gz,d:Math.hypot(world.x-point.x,world.z-point.z)});
  }
  return candidates.sort((a,b)=>a.d-b.d)[0];
 }
 const a=snap(start),b=snap(end,true);
 if(!a||!b)return null;
 const goal=key(b.x,b.z),open=[],nodes=new Map(),closed=new Set();
 // Prioritize progress across the larger precinct while retaining exact collision checks.
 const estimate=(x,z)=>{
  const dx=Math.abs(x-b.x),dz=Math.abs(z-b.z);
  return 1.4*(Math.max(dx,dz)+(Math.SQRT2-1)*Math.min(dx,dz));
 };
 const initial={...a,g:0,f:estimate(a.x,a.z),parent:null};open.push(initial);nodes.set(key(a.x,a.z),initial);let found;
 while(open.length&&closed.size<SEARCH_LIMIT){let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;const n=open.splice(best,1)[0],nk=key(n.x,n.z);if(nk===goal){found=n;break}closed.add(nk);
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=n.x+dx,z=n.z+dz,k=key(x,z);if(closed.has(k)||!validPosition(x*STEP,z*STEP)||!clearSegment({x:n.x*STEP,z:n.z*STEP},{x:x*STEP,z:z*STEP}))continue;if(dx&&dz&&(!validPosition((n.x+dx)*STEP,n.z*STEP)||!validPosition(n.x*STEP,(n.z+dz)*STEP)))continue;const g=n.g+Math.hypot(dx,dz);let next=nodes.get(k);if(next&&next.g<=g)continue;if(!next){next={x,z};open.push(next);nodes.set(k,next)}Object.assign(next,{g,f:g+estimate(x,z),parent:n})}}
 if(!found)return null;const reversed=[];for(let n=found;n;n=n.parent)reversed.push({x:n.x*STEP,z:n.z*STEP});const raw=[start,...reversed.reverse(),end],result=[];let i=0;while(i<raw.length-1){let j=raw.length-1;while(j>i+1&&!clearSegment(raw[i],raw[j]))j--;result.push(raw[j]);i=j}return result;
}
