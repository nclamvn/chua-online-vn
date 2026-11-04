import * as T from './vendor/three.module.js';
import {buildWestCostume} from './west-costumes.js';
import {COSTUMES} from './fair-catalog.js';

export const costumeById = new Map(COSTUMES.map(costume=>[costume.id,costume]));

// Scaled primitives share geometry across actors and live guests.
const shapes={
 oval:new T.SphereGeometry(1,20,14), dome:new T.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2),
 bar:new T.BoxGeometry(1,1,1), ring:new T.TorusGeometry(1,.07,8,32),
 disc:new T.CylinderGeometry(1,1,1,28), spike:new T.ConeGeometry(1,1,6)
};
const maskOutline=new T.Shape();
maskOutline.moveTo(-.082,.095);
maskOutline.lineTo(.082,.095);
maskOutline.lineTo(.089,.024);
maskOutline.lineTo(.069,-.026);
maskOutline.lineTo(.054,-.072);
maskOutline.lineTo(-.054,-.072);
maskOutline.lineTo(-.069,-.026);
maskOutline.lineTo(-.089,.024);
maskOutline.closePath();
shapes.mask=new T.ExtrudeGeometry(maskOutline,{depth:.025,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2});
const swatches=new Map();
function paint(color){
 if(!swatches.has(color))swatches.set(color,new T.MeshStandardMaterial({color,roughness:.68}));
 return swatches.get(color);
}
function part(parent,shape,color,x,y,z,sx,sy,sz){
 const m=new T.Mesh(shapes[shape],paint(color));
 m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);
 return m;
}
function anchor(bones,alias){const g=new T.Group();bones[alias]?.add(g);return g}
function cape(back,color,width=.26){
 const geometry=new T.PlaneGeometry(1,1,12,9),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const u=p.getX(i),v=.5-p.getY(i);
  p.setXYZ(i,u*(width+v*.2)*2,.15-v*.83,-.1-v*.13+Math.cos(u*24)*.025);
 }
 geometry.computeVertexNormals();
 const material=paint(color).clone();material.side=T.DoubleSide;
 const mesh=new T.Mesh(geometry,material);
 mesh.userData.costumeGeometry=true;mesh.userData.ownMaterial=true;back.add(mesh);
}
function staff(parent,color,tip){
 part(parent,'disc',color,0,-.33,.045,.017,1.42,.017);
 part(parent,'disc',tip,0,.37,.045,.031,.18,.031);
 part(parent,'disc',tip,0,-1.02,.045,.03,.15,.03);
}
function headgear(head,color){part(head,'oval',color,0,.081,-.009,.119,.156,.129)}
function eyes(head,color){
 for(const sign of [-1,1]){
  const lens=part(head,'oval',color,sign*.044,.09,.105,.042,.043,.024);
  lens.rotation.z=sign*.44;
 }
}
function shield(hand){
 for(const [radius,color,z] of [[.245,'#a82d32',.019],[.195,'#dedad0',.034],[.144,'#a82d32',.046],[.096,'#264577',.057]]){
  part(hand,'disc',color,0,.07,z,radius,.027,radius).rotation.x=Math.PI/2;
 }
 for(let i=0;i<5;i++){
  const a=i*Math.PI*.4;
  part(hand,'spike','#f4efe2',Math.sin(a)*.039,.07+Math.cos(a)*.039,.076,.027,.082,.012).rotation.z=-a;
 }
}

export function attachCostume(costume,bones,{aliases,bones:rest}){

 const {style,colors:[main,trim]}=costume;
 const head=anchor(bones,aliases.head),chest=anchor(bones,aliases.chest);
 const right=anchor(bones,aliases.right?.hand),left=anchor(bones,aliases.left?.hand);
 const steel='#d5d9d5',ink='#171f28';
 for(const side of [aliases.left,aliases.right]){
  if(!side)continue;
  const foot=anchor(bones,side.foot);
  const boot=['iron','ranger','spider','captain'].includes(style)?main:'#4c3b30';
  part(foot,'oval',boot,0,-.023,.053,.054,.042,.106);
  part(foot,'oval',ink,0,-.053,.05,.056,.014,.106);
  if(style==='iron'||style==='ranger'||style==='spider'){
   const wrist=anchor(bones,side.elbow);
   const direction=new T.Vector3(...rest[side.hand].head).sub(new T.Vector3(...rest[side.elbow].head));
   const guard=part(wrist,'oval',style==='spider'?trim:main,direction.x*.62,direction.y*.62,direction.z*.62,.05,direction.length()*.38,.055);
   guard.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
   part(anchor(bones,side.hand),'oval',main,0,-.018,.035,.039,.053,.04);
  }
 }
 switch(style){
  case 'pilgrim':
  case 'monkey':
  case 'boar':
  case 'river':
   buildWestCostume({style,head,chest,hip:anchor(bones,aliases.pelvis),right,part,staff});
   break;
  case 'spider':
   headgear(head,main);eyes(head,ink);
   for(const x of [-.044,.044])part(head,'oval','#fff4e1',x,.093,.123,.026,.030,.013).rotation.z=Math.sign(x)*.43;
   for(let i=0;i<5;i++)part(head,'ring','#392323',0,.05+i*.032,-.003,.117-Math.abs(i-1)*.01,.112-i*.008,.095).rotation.x=Math.PI/2;
   part(chest,'oval',ink,0,.045,.177,.023,.045,.009);
   for(let i=0;i<4;i++)for(const sign of [-1,1])part(chest,'bar',ink,sign*.035,.083-i*.025,.168,.055,.01,.01).rotation.z=sign*(.68-i*.4);
   break;
  case 'iron':
   headgear(head,main);
   part(head,'mask',trim,0,.068,.097,1,1,1);
   part(head,'bar','#784027',0,.025,.132,.095,.008,.009);
   part(chest,'oval',main,0,.036,.115,.165,.159,.084);
   for(const sign of [-1,1]){
    part(chest,'oval',trim,sign*.125,.033,.133,.042,.095,.061).rotation.z=sign*.32;
   }
   for(const sign of [-1,1]){
    part(head,'bar','#c2edf1',sign*.044,.101,.131,.055,.017,.014).rotation.z=sign*.16;
    part(chest,'oval',trim,sign*.172,.125,.015,.099,.05,.114);
   }
   part(chest,'oval','#98e7f7',0,.058,.207,.047,.047,.019);
   part(chest,'ring',steel,0,.058,.221,.052,.052,.052);
   break;
  case 'captain':
   part(head,'dome',main,0,.092,-.007,.121,.133,.125);
   part(head,'bar',steel,0,.162,.102,.025,.049,.028);
   for(const sign of [-1,1])part(head,'bar',steel,sign*.013,.162,.108,.01,.049,.02).rotation.z=-sign*.37;
   shield(left);break;
  case 'thunder':
   cape(chest,trim,.31);
   part(head,'dome',steel,0,.1,-.006,.125,.129,.126);
   for(const sign of [-1,1])part(head,'spike',steel,sign*.119,.147,-.02,.042,.195,.105).rotation.z=-sign*.41;
   for(const sign of [-1,1])for(const y of [-.02,.1])part(chest,'oval',steel,sign*.083,y,.161,.04,.041,.021);
   part(right,'disc','#71503a',0,-.048,.049,.025,.34,.025);
   part(right,'bar',steel,0,.125,.049,.24,.115,.121);break;
  case 'ranger':
   headgear(head,main);
   part(head,'oval',ink,0,.089,.097,.105,.053,.044);
   part(head,'oval',trim,0,.018,.109,.064,.029,.03);
   for(const sign of [-1,1])part(chest,'bar',trim,sign*.065,.047,.166,.17,.031,.034).rotation.z=sign*.66;
   break;
 }
}
