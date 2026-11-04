import * as T from './vendor/three.module.js';
const people=new Set();let faceGeometry;
fetch('/assets/r3/human-head.json').then(r=>{if(!r.ok)throw Error('head');return r.json()}).then(j=>{faceGeometry=new T.BufferGeometryLoader().parse(j);for(const p of people)p.face.geometry=faceGeometry}).catch(()=>{});
const clothNormal=new T.TextureLoader().load('/assets/r3/rough_linen/normal-gl.jpg');clothNormal.wrapS=clothNormal.wrapT=T.RepeatWrapping;clothNormal.repeat.set(2,3);
const skin=new T.MeshStandardMaterial({color:'#ba9276',roughness:.72});
const shoe=new T.MeshStandardMaterial({color:'#302d27',roughness:.95});
const ball=new T.SphereGeometry(1,20,14),limb=new T.CylinderGeometry(1,1,1,14);
function shape(g,m,parent,s,p){const mesh=new T.Mesh(g,m);mesh.scale.set(...s);mesh.position.set(...p);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh}
function segment(mesh,a,b,width){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);mesh.position.copy(av.add(bv).multiplyScalar(.5));mesh.scale.set(width,d.length(),width);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize())}
export function createVisitor({name='Bạn',color='#827363',local=false,npc=false}={}){
 const root=new T.Group();root.userData.dynamic=true;
 const robe=new T.MeshStandardMaterial({color,roughness:1,normalMap:clothNormal,normalScale:new T.Vector2(.13,.13)});
 const torso=new T.Group();root.add(torso);
 // Subtle radial folds and a narrow shoulder line, in human proportions.
 const rings=[[0,.27],[.12,.265],[.34,.21],[.62,.23],[.73,.17]],pos=[],uv=[],ix=[];const n=40;
 for(let y=0;y<rings.length;y++)for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,r=rings[y][1]+Math.sin(a*13)*.009;pos.push(Math.sin(a)*r,.62+rings[y][0],Math.cos(a)*r*.64);uv.push(i/n,y/(rings.length-1))}
 for(let y=0;y<rings.length-1;y++)for(let i=0;i<n;i++){const a=y*(n+1)+i;ix.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1)}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();shape(g,robe,torso,[1,1,1],[0,0,0]);
 shape(limb,skin,torso,[.055,.1,.055],[0,1.4,0]);
 const face=shape(faceGeometry||new T.SphereGeometry(1,20,14).scale(.34,.49,.37),skin,torso,[.28,.28,.28],[0,1.59,.005]);
 // Head data is already normalized to unit height.
 shape(new T.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI*.46),new T.MeshStandardMaterial({color:'#28251f',roughness:.92}),torso,[.103,.133,.101],[0,1.62,-.007]);
 const arms=[],legs=[];
 for(let i=0;i<2;i++){
 const upper=shape(limb,robe,torso,[1,1,1],[0,0,0]),lower=shape(limb,robe,torso,[1,1,1],[0,0,0]),hand=shape(ball,skin,torso,[.035,.074,.022],[0,0,0]);arms.push({upper,lower,hand});
 const thigh=shape(limb,robe,root,[1,1,1],[0,0,0]),shin=shape(limb,robe,root,[1,1,1],[0,0,0]),foot=shape(ball,shoe,root,[.073,.045,.14],[0,0,0]);legs.push({thigh,shin,foot});
 }
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=64;const cx=canvas.getContext('2d');cx.fillStyle='rgba(22,32,27,.75)';cx.beginPath();cx.roundRect(8,6,368,52,22);cx.fill();cx.font='24px sans-serif';cx.textAlign='center';cx.fillStyle='#f5f1df';cx.fillText(local?'Bạn':name,192,40);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const label=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false,transparent:true}));label.scale.set(1.4,.235,1);label.position.y=1.95;label.visible=!npc;root.add(label);
 const visitor={root,face,pose:'idle',update(pose,time){this.pose=pose;const sitting=pose==='meditate',greet=pose==='greet',walking=pose==='walk';torso.position.y=sitting?-.5:0;torso.rotation.x=greet?.12:0;label.position.y=sitting?1.43:1.95;
 arms.forEach((a,i)=>{const s=i===0?-1:1,swing=walking?Math.sin(time*.011+i*Math.PI)*.15:0;
 const shoulder=[s*.205,1.28,0],elbow=sitting?[s*.30,.87,.12]:greet?[s*.27,1.02,.18]:[s*.255,1.02,swing],wrist=sitting?[s*.07,.78,.25]:greet?[s*.023,1.23,.35]:[s*.27,.79,swing*1.4];segment(a.upper,shoulder,elbow,.073);segment(a.lower,elbow,wrist,.06);a.hand.position.set(...wrist);a.hand.rotation.set(greet?-.15:sitting?1.5:0,0,greet?-s*.08:0)});
 legs.forEach((l,i)=>{const s=i===0?-1:1,swing=walking?Math.sin(time*.011+i*Math.PI)*.18:0;const hip=[s*.115,sitting?.32:.7,0],knee=sitting?[s*.34,.13,.26]:[s*.115,.38,swing],ankle=sitting?[-s*.13,.095,.3]:[s*.115,.075,-swing];segment(l.thigh,hip,knee,.103);segment(l.shin,knee,ankle,.085);l.foot.position.set(ankle[0],ankle[1]-.02,ankle[2]+.065);l.foot.rotation.y=sitting?s*1.4:0});
 },dispose(){people.delete(this);tex.dispose();label.material.dispose();robe.dispose()}};
 people.add(visitor);visitor.update('idle',0);return visitor;
}
