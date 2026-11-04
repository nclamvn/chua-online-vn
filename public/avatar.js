import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {clone as cloneSkeleton} from './vendor/SkeletonUtils.js';
import {MeshoptDecoder} from './assets/r3/meshopt_decoder.module.js';
import {createVisitor as fallbackVisitor} from './avatar-fallback.js';
import {attachCostume,costumeById} from './costumes.js';
import {normalizeAppearance} from './world-rules.js?v=pond-parking-1';
T.Cache.enabled=true;
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),cache=new Map();let manifestPromise;
export function getPeopleManifest(){return manifestPromise||(manifestPromise=fetch('/assets/r4/people/manifest.json').then(r=>{if(!r.ok)throw Error('Chưa tải được tủ nhân vật.');return r.json()}))}
async function getPerson(profile,detail='near'){const url=(detail==='far'?profile.far:profile.person).url;if(!cache.has(url))cache.set(url,Promise.all([loader.loadAsync(url),fetch(profile.joints).then(r=>r.json())]));return cache.get(url)}
export const CLOTH_PALETTE=['#354e61','#e8dac2','#64847a','#ae6d51','#65617c','#c19d5f','#51797e','#a47c80'];
export function shadeCloth(shader){
 // Keep the creases and seams of the source fabric, with a neutral albedo for dye colors.
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
  #ifdef USE_MAP
   vec4 fabric=texture2D(map,vMapUv);
   float value=dot(fabric.rgb,vec3(.2126,.7152,.0722));
   diffuseColor*=vec4(vec3(mix(.29,.94,smoothstep(.005,.46,value))),fabric.a);
  #endif
 `);
}
const clothColors=CLOTH_PALETTE.map(c=>new T.Color(c));
const va=new T.Vector3(),vb=new T.Vector3(),vc=new T.Vector3(),vd=new T.Vector3(),qe=new T.Quaternion(),qp=new T.Quaternion(),qw=new T.Quaternion();
function aim(bone,child,target){if(!bone||!child)return;bone.updateWorldMatrix(true,true);bone.getWorldPosition(va);child.getWorldPosition(vb);vc.copy(vb).sub(va).normalize();vd.copy(target).sub(va).normalize();if(vc.lengthSq()<.1||vd.lengthSq()<.1)return;qe.setFromUnitVectors(vc,vd);bone.getWorldQuaternion(qw);qw.premultiply(qe);bone.parent.getWorldQuaternion(qp).invert();bone.quaternion.copy(qp.multiply(qw));bone.updateWorldMatrix(false,true)}
function solveLimb(model,bones,names,targetArray,poleArray){const upper=bones[names[0]],mid=bones[names[1]],end=bones[names[2]];if(!upper||!mid||!end)return;model.updateWorldMatrix(true,true);const a=upper.getWorldPosition(new T.Vector3()),b=mid.getWorldPosition(new T.Vector3()),c=end.getWorldPosition(new T.Vector3()),target=model.localToWorld(new T.Vector3(...targetArray)),pole=model.localToWorld(new T.Vector3(...poleArray));const l1=a.distanceTo(b),l2=b.distanceTo(c),dir=target.clone().sub(a),distance=T.MathUtils.clamp(dir.length(),.01,l1+l2-.003);dir.normalize();const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along)),out=pole.sub(a);out.addScaledVector(dir,-out.dot(dir)).normalize();const elbow=a.clone().addScaledVector(dir,along).addScaledVector(out,height);const wrist=a.clone().addScaledVector(dir,distance);aim(upper,mid,elbow);aim(mid,end,wrist)}
export function labelSprite(name){const c=document.createElement('canvas');c.width=512;c.height=80;const x=c.getContext('2d');x.fillStyle='#193c35dc';x.beginPath();x.roundRect(8,8,496,64,25);x.fill();x.fillStyle='#f0e7cf';x.font='28px sans-serif';x.textAlign='center';x.fillText(name,256,51);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map,depthTest:false,transparent:true}));sprite.scale.set(1.55,.24,1);sprite.position.y=1.95;return sprite}
export function createVisitor({name='Bạn',local=false,npc=false,appearance={},color,detail='near',castShadow=true}={}){
 let style=normalizeAppearance(appearance),model=null,bones={},metadata=null,profile=null,generation=0,disposed=false,lastPose='idle',poseStart=0,lastUpdate=0;const root=new T.Group();root.userData.dynamic=true;
 const fallback=fallbackVisitor({name,color:color||'#827363',local,npc});root.add(fallback.root);const label=labelSprite(local?'Bạn':name);label.visible=local;root.add(label);fallback.root.traverse(o=>{if(o.isSprite)o.visible=false});
 function detach(){
  if(!model)return;
  root.remove(model);
  model.traverse(o=>{
   if(o.userData.ownMaterial)o.material.dispose();
   if(o.userData.costumeGeometry)o.geometry.dispose();
  });
  model=null;
 }
 function setAppearance(value){
  const next=normalizeAppearance(value);
  if(visitor.ready&&JSON.stringify(next)===JSON.stringify(style))return visitor.ready;
  style=next;
  const epoch=++generation;
  visitor.ready=getPeopleManifest().then(async manifest=>{
   const selected=manifest.profiles[next.profile%manifest.profiles.length];
   const [gltf,joints]=await getPerson(selected,detail);
   if(disposed||epoch!==generation)return;
   detach();
   profile=selected;
   metadata=joints;
   model=cloneSkeleton(gltf.scene);
   model.userData.dynamic=true;
   bones={};
   const costume=costumeById.get(next.outfit);
   model.traverse(o=>{
    if(o.isBone)bones[o.name]=o;
    if(!o.isMesh)return;
    o.castShadow=castShadow;o.receiveShadow=true;
    const name=o.name.toLowerCase();
    if(name.includes('cloth')){
     o.material=o.material.clone();
     o.userData.ownMaterial=true;
     o.material.color.copy(costume?new T.Color(costume.colors[0]):clothColors[next.palette]);
     o.material.onBeforeCompile=shadeCloth;
     o.material.roughness=1;
    }
    if(name.includes('hair')&&next.hair===5)o.visible=false;
   });
   for(const key of Object.keys(metadata.bones)){
    const bone=bones[T.PropertyBinding.sanitizeNodeName(key)];
    if(bone)bones[key]=bone;
   }
   if(costume)attachCostume(costume,bones,metadata);
   const h=[1,.94,1.03,.96,1.01,.95,1.05,.98][next.profile%8];
   model.scale.set(1,h,1);
   root.add(model);
   fallback.root.visible=false;
   root.userData.avatarAsset=profile.id;
   root.userData.avatarTriangles=profile.person.triangles;
   root.userData.avatarReady=true;
   lastUpdate=0;
   visitor.update(lastPose,performance.now(),true);
  }).catch(error=>{
   root.userData.avatarReady=false;
   console.warn('Hiên An avatar asset unavailable',error.message);
  });
  return visitor.ready;
 }
 let nameUntil=0;
 function update(pose,time,force=false){if(!npc&&!local)label.visible=performance.now()<nameUntil;if(pose!==lastPose){poseStart=time;lastPose=pose}fallback.update(pose==='prostrate'?'greet':pose,time);if(!model)return;if(!force&&npc&&time-lastUpdate<65)return;lastUpdate=time;const aliases=metadata.aliases||{},sitting=pose==='meditate',greet=pose==='greet',walking=pose==='walk',bow=pose==='prostrate',progress=((time-poseStart)%3300)/3300,kneel=bow?Math.sin(progress*Math.PI):0;
 for(const name of [aliases.pelvis,aliases.spine,aliases.chest,aliases.neck,aliases.head,...['left','right'].flatMap(k=>{const a=aliases[k]||{};return [a.upperArm,a.elbow,a.hand,a.hip,a.knee,a.foot]})]){const b=bones[name];if(b){b.quaternion.identity();const rest=metadata.bones[name]?.restLocalTranslation;if(rest)b.position.fromArray(rest)}}
 const pelvis=bones[aliases.pelvis],spine=bones[aliases.spine];if(pelvis)pelvis.position.y-=sitting?.55:kneel*.52;if(spine)spine.rotation.x=bow?kneel*1.15:greet?.10:0;label.position.y=sitting?1.4:bow?1.95-kneel*.7:1.95;
 model.updateMatrixWorld(true);
 for(const [side,sign] of [['left',1],['right',-1]]){const a=aliases[side];if(!a)continue;const phase=time*.007+(sign<0?Math.PI:0),swing=walking?Math.sin(phase):0,lift=walking?Math.max(0,Math.cos(phase))*.06:0;
 const hand=sitting?[sign*.035,.58,.34]:greet?[sign*.029,1.27,.34]:bow?[sign*.20,.88-kneel*.57,.25+kneel*.34]:[sign*.24,.88,swing*.14+.02];
 const pole=sitting?[sign*.38,.66,.12]:greet?[sign*.38,1.04,.16]:bow?[sign*.36,.7,.5]:[sign*.35,1.09,swing*.08];
 solveLimb(model,bones,[a.upperArm,a.elbow,a.hand],hand,pole);
 const wrist=bones[a.hand];if(wrist){const rest=metadata.bones[a.hand],direction=new T.Vector3(...rest.tail).sub(new T.Vector3(...rest.head)).normalize(),desired=new T.Vector3(...(greet?[0,1,0]:sitting?[sign*.4,0,.7]:[0,-.3,.8])).normalize();const q=new T.Quaternion().setFromUnitVectors(direction,desired);if(greet)q.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),sign*.7));model.getWorldQuaternion(qw);q.premultiply(qw);wrist.parent.getWorldQuaternion(qp).invert();wrist.quaternion.copy(qp.multiply(q))}
 const foot=sitting?[-sign*.13,.105,.33]:bow?[sign*.13,.08,.05-kneel*.36]:[sign*.13,.075+lift,swing*.22];const knee=sitting?[sign*.48,.22,.25]:bow?[sign*.20,.15,.38]:[sign*.18,.48,.20+swing*.12];solveLimb(model,bones,[a.hip,a.knee,a.foot],foot,knee);
 const ankle=bones[a.foot];if(ankle){const q=new T.Quaternion().setFromEuler(new T.Euler(sitting?.12:walking?-swing*.1:0,sitting?sign*1.1:0,0));model.getWorldQuaternion(qw);q.premultiply(qw);ankle.parent.getWorldQuaternion(qp).invert();ankle.quaternion.copy(qp.multiply(q))}
 }
 model.updateMatrixWorld(true);
 }
 const visitor={root,getModel:()=>model,face:fallback.face,ready:null,update,revealName(){if(!npc){nameUntil=performance.now()+3800;label.visible=true}},setAppearance,getAppearance:()=>({...style}),dispose(){disposed=true;generation++;detach();fallback.dispose();root.remove(fallback.root);label.material.map.dispose();label.material.dispose()}};setAppearance(style);return visitor;
}
