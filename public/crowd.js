import {clearSegment} from './pathfinding.js?v=hoi-rong-1';
import {onHallDeck} from './hall-layout.js?v=hall-200';
import {BODY_RADIUS,createBodyGrid} from './body-collision.js?v=hoi-rong-1';
import {LION_POINT} from './fair-catalog.js?v=hoi-rong-1';
import * as T from './vendor/three.module.js';
import {createSimplePeople} from './simple-people.js?v=surface-1';
import {createVisitor,getPeopleManifest,CLOTH_PALETTE,shadeCloth} from './avatar.js';
import {validPosition,groundHeight,SEATS} from './world-rules.js?v=hoi-rong-1';
// Local crowd simulation. Never enters the live visitor count or presence API.
export function createCrowd({scene,host,max=1000}){
 let seed=0x48714a;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const palette=['#82715f','#b4a58f','#586e66','#655664','#385964','#a38a65','#8b6c5b','#b5b7a8'].map(c=>new T.Color(c));
 const simple=createSimplePeople(scene,max);
 const {far,params,tints,clock}=simple;
 const geometry=far.geometry;
 const actors=[],near=[],temp=new T.Object3D(),zero=new T.Matrix4().makeScale(0,0,0);
 const bodies=createBodyGrid();
 const frustum=new T.Frustum(),projection=new T.Matrix4(),bounds=new T.Sphere(new T.Vector3(),2);
 const farTints=palette.map(c=>c.toArray()),clothes=CLOTH_PALETTE.map(c=>new T.Color(c));
 const slots=new Uint16Array(8);let textured=null,count=0,quality='balanced',reduced=false,last=0,selectedCount=0;
 const gardenSeats=SEATS.filter(seat=>!seat.id.startsWith('hall:'));
 function allowed(x,z){return !onHallDeck(x,z)&&!(Math.abs(x)<2.85&&z>66&&z<97)&&Math.hypot(x-LION_POINT.x,z-LION_POINT.z)>1.9&&validPosition(x,z)&&!gardenSeats.some(s=>Math.hypot(x-s.x,z-s.z)<1.15)}
 const spawnAreas=[[-55,55,36,89],[-55,55,36,89],[-55,55,36,89],[-64,-35,-26,5],[35,64,-26,5],[-67,-38,33,60],[36,69,32,63],[-23,23,-55,-32],[-20,20,-5,12]];
 for(let i=0;i<max;i++){
  const area=spawnAreas[i%spawnAreas.length];
  let x,z;
  do{
   x=area[0]+rand()*(area[1]-area[0]);z=area[2]+rand()*(area[3]-area[2]);
  }while(!allowed(x,z)||bodies.blocks({x,z},x,z));
  const actor={x,z,yaw:rand()*6.28,speed:.5+rand()*.65,phase:rand()*6.28,kind:i%13===0?3:0,pose:0,pause:rand()*8,near:false,appearance:{profile:i%8,hair:0,outfit:0,palette:Math.floor(i/8)%8}};
  actors.push(actor);bodies.add(actor);
  far.setColorAt(i,new T.Color('#ffffff'));far.setMatrixAt(i,zero);
 }
 const poolSize=24;for(let i=0;i<poolSize;i++){const rig=createVisitor({local:false,name:'',npc:true,appearance:{profile:i%8,hair:0,outfit:0,palette:Math.floor(i/8)%8}});rig.root.visible=false;scene.add(rig.root);near.push({rig,index:-1})}
 async function bakeTexturedCrowd(){
  const manifest=await getPeopleManifest(),groups=await Promise.all(manifest.profiles.map(async(p,profileIndex)=>{
    const rig=createVisitor({npc:true,detail:'far',appearance:{profile:profileIndex,palette:0}});await rig.ready;const model=rig.getModel();if(!model){rig.dispose();return null}rig.update('idle',0,true);rig.root.updateMatrixWorld(true);const meshes=[],capacity=Math.ceil(max/8),profileParams=new Float32Array(capacity*4);
    model.traverse(source=>{if(!source.isMesh)return;const g=source.geometry.clone(),positions=new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count*3),3),kinds=new Float32Array(positions.count),v=new T.Vector3();source.skeleton?.update();for(let i=0;i<positions.count;i++){v.fromBufferAttribute(source.geometry.attributes.position,i);if(source.isSkinnedMesh)source.applyBoneTransform(i,v);v.applyMatrix4(source.matrixWorld);positions.setXYZ(i,v.x,v.y,v.z);kinds[i]=v.y<.79?(v.x>0?1:2):Math.abs(v.x)>.205&&v.y<1.42?(v.x>0?3:4):0}g.setAttribute('position',positions);g.deleteAttribute('skinIndex');g.deleteAttribute('skinWeight');g.deleteAttribute('normal');g.deleteAttribute('tangent');g.computeVertexNormals();g.setAttribute('limbKind',new T.BufferAttribute(kinds,1));g.setAttribute('crowdParams',new T.InstancedBufferAttribute(profileParams,4));const material=source.material.clone();const isClothes=source.name.toLowerCase().includes('cloth');if(isClothes)material.color.set('#ffffff');material.onBeforeCompile=shader=>{if(isClothes)shadeCloth(shader);shader.uniforms.crowdTime=clock;shader.vertexShader='attribute float limbKind; attribute vec4 crowdParams; uniform float crowdTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
     float kind=limbKind;float pose=crowdParams.z;float swing=sin(crowdTime*5.4*crowdParams.x+crowdParams.y)*.26*step(.5,pose)*(1.-step(1.5,pose));
     if(kind>.5){float side=mod(kind,2.)>.5?1.:-1.;float pivot=kind<2.5?.79:1.31;float angle=swing*side*(kind>2.5?-1.:1.);if(pose>1.5&&pose<2.5&&kind>2.5)angle=-.95;if(pose>2.5&&kind<2.5)angle=-1.1;float yy=transformed.y-pivot,zz=transformed.z;transformed.y=pivot+yy*cos(angle)-zz*sin(angle);transformed.z=yy*sin(angle)+zz*cos(angle);if(pose>1.5&&pose<2.5&&kind>2.5)transformed.x*=.38;}if(pose>2.5){if(kind<.5||kind>2.5)transformed.y-=.5;else transformed.y*=.45;}
    `)};material.customProgramCacheKey=()=> isClothes?'hien-an-crowd-fabric':'hien-an-crowd-textured';const batch=new T.InstancedMesh(g,material,capacity);batch.userData.dynamic=true;batch.castShadow=false;batch.receiveShadow=true;batch.frustumCulled=false;batch.instanceMatrix.setUsage(T.DynamicDrawUsage);for(let i=0;i<capacity;i++){batch.setMatrixAt(i,zero);if(isClothes)batch.setColorAt(i,clothTint(i*8+profileIndex))}scene.add(batch);meshes.push({batch,isClothes})});rig.dispose();return {meshes,params:profileParams};
  }));if(groups.some(g=>!g))return;textured=groups;setCount(selectedCount);host.dataset.crowdAssets='textured-8-profiles';
 }
 function clothTint(i){return clothes[Math.floor(i/8)%clothes.length]}
 bakeTexturedCrowd().catch(e=>console.warn('Textured crowd fallback',e.message));
 function setCount(value){count=[0,100,300,1000].includes(Number(value))?Number(value):100;selectedCount=count;bodies.replace(actors.slice(0,count));far.count=0;if(textured)for(const g of textured)for(const {batch} of g.meshes)batch.count=0;host.dataset.simulatedPeople=String(count);for(const n of near){n.index=-1;n.rig.root.visible=false}for(const a of actors)a.near=false;last=0}
 function configure(opts){quality=opts.quality||quality;reduced=opts.reduced??reduced;last=0}
 function update(now,camera,otherBodies,trafficBlocks){clock.value=reduced?0:now*.001;if(!count)return;const interval=quality==='light'?100:50,dt=last?Math.min(.2,(now-last)/1000):.05;if(now-last<interval)return;last=now;const cpuStart=performance.now();
 camera.updateMatrixWorld();
 frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 const visible=[],close=[];
 for(let i=0;i<count;i++){
  const a=actors[i];
  if(otherBodies.blocks(a,a.x,a.z,a,BODY_RADIUS+.13)){
   let clear=false;
   for(const distance of [.32,.65,.95]){
    for(let j=0;j<8;j++){
     const yaw=a.yaw+j*Math.PI/4,nx=a.x+Math.sin(yaw)*distance,nz=a.z+Math.cos(yaw)*distance;
     const point={x:nx,z:nz};
     if(allowed(nx,nz)&&clearSegment(a,point)&&!otherBodies.blocks(point,nx,nz)&&!trafficBlocks(a,nx,nz)&&!bodies.blocks(a,nx,nz)){
      bodies.move(a,nx,nz);clear=true;break;
     }
    }
    if(clear)break;
   }
   if(!clear&&otherBodies.blocks(a,a.x,a.z))continue;
  }
  a.pose=a.kind===3?3:a.pause>0?0:1;a.pause-=dt;
  if(!reduced&&a.kind!==3){
   if(a.pause< -8-rand()*10){a.pause=2+rand()*5;a.yaw+=rand()*2-1}
   if(a.pose===1){
    const nx=a.x+Math.sin(a.yaw)*a.speed*dt,nz=a.z+Math.cos(a.yaw)*a.speed*dt;
    if(allowed(nx,nz)&&!bodies.blocks(a,nx,nz)&&!otherBodies.blocks(a,nx,nz)&&!trafficBlocks(a,nx,nz)){
     bodies.move(a,nx,nz);
    }else{
     a.yaw+=(i%2?1:-1)*(.75+rand()*.6);
     a.pose=0;
    }
   }
   if(a.pause>1&&i%7===0&&Math.sin(now*.0004+a.phase)>.6)a.pose=2;
  }
 bounds.center.set(a.x,groundHeight(a.x,a.z)+.9,a.z);
 if(frustum.intersectsSphere(bounds)){
  const distance=Math.hypot(a.x-camera.position.x,a.z-camera.position.z);
  visible.push({i,distance});
  if(distance<26)close.push({i,distance});
 }}
 close.sort((a,b)=>a.distance-b.distance);const ids=close.slice(0,quality==='light'?8:24).map(v=>v.i),wanted=new Set(ids);
 for(const n of near){if(!wanted.has(n.index)){n.index=-1;n.rig.root.visible=false}}
 for(const id of ids){let n=near.find(p=>p.index===id);if(!n){n=near.find(p=>p.index<0);if(!n)break;n.index=id;n.rig.setAppearance?.(actors[id].appearance)}const a=actors[id];n.rig.root.visible=true;n.rig.root.position.set(a.x,groundHeight(a.x,a.z),a.z);n.rig.root.rotation.y=a.yaw;n.rig.update(['idle','walk','greet','meditate'][a.pose],reduced?0:now)}
 slots.fill(0);
 let simpleCount=0;
 for(const {i,distance} of visible){
  if(wanted.has(i))continue;
  const a=actors[i],profile=i%8;
  temp.position.set(a.x,groundHeight(a.x,a.z),a.z);
  temp.rotation.set(0,a.yaw,0);
  temp.scale.set(.92+(i%4)*.045,.93+(i%9)*.018,1);
  temp.updateMatrix();
  if(textured&&(quality!=='light'||distance<32)){
   const group=textured[profile],index=slots[profile]++;
   group.params.set([a.speed,a.phase,a.pose,1],index*4);
   for(const {batch,isClothes} of group.meshes){
    batch.setMatrixAt(index,temp.matrix);
    if(isClothes)batch.setColorAt(index,clothTint(i));
   }
  }else{
   far.setMatrixAt(simpleCount,temp.matrix);
   params.set([a.speed,a.phase,a.pose,1],simpleCount*4);
   tints.set(farTints[profile],simpleCount*3);
   simpleCount++;
  }
 }
 far.count=simpleCount;
 far.instanceMatrix.needsUpdate=true;
 geometry.attributes.crowdParams.needsUpdate=true;
 geometry.attributes.crowdTint.needsUpdate=true;
 if(textured)for(const [i,g] of textured.entries())for(const {batch,isClothes} of g.meshes){
  batch.count=slots[i];
  batch.instanceMatrix.needsUpdate=true;
  if(isClothes)batch.instanceColor.needsUpdate=true;
  batch.geometry.attributes.crowdParams.needsUpdate=true;
 }
 host.dataset.crowdRendered=String(visible.length);
 host.dataset.crowdSimple=String(simpleCount);
 host.dataset.crowdNear=String(wanted.size);host.dataset.crowdFarDrawCalls=String(textured?textured.reduce((n,g)=>n+g.meshes.length,0):1);host.dataset.crowdUpdateMs=(performance.now()-cpuStart).toFixed(2);host.dataset.crowdTickMs=String(Math.round(dt*1000));
 }
 setCount(100);
 return {setCount,configure,update,blocks:bodies.blocks,someNear:bodies.someNear,getCount:()=>selectedCount,dispose(){if(textured)for(const g of textured)for(const {batch} of g.meshes){scene.remove(batch);batch.geometry.dispose();batch.material.dispose()}simple.dispose();for(const n of near){scene.remove(n.rig.root);n.rig.dispose()}}};
}
