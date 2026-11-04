import * as T from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

import {LION_POINT,BEAT_MS} from './fair-catalog.js';
const colors={
 gold:['#e2a534',.4], brass:['#a75c26',.46], lacquer:['#aa3326',.42],
 dark:['#471c20',.62], cream:['#f5dec1',.78], ink:['#281a1e',.62],
 jade:['#337465',.56], orange:['#ce5b2a',.63], petal:['#f4bd5c',.72],
 ruby:['#912a25',.78], tooth:['#f5e8c9',.7]
};
const mats=Object.fromEntries(Object.entries(colors).map(([key,[color,roughness]])=>[key,new T.MeshStandardMaterial({color,roughness,metalness:key==='gold'?.25:0})]));
const oval=new T.SphereGeometry(1,18,12),round=new T.CylinderGeometry(1,1,1,24);
const segment=new T.TorusGeometry(1,.12,9,28);
function put(parent,geometry,material,x,y,z,sx,sy,sz){
 const mesh=new T.Mesh(geometry,mats[material]);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
}
const ball=(p,m,x,y,z,sx,sy,sz)=>put(p,oval,m,x,y,z,sx,sy,sz);
const ring=(p,m,x,y,z,sx,sy,sz)=>put(p,segment,m,x,y,z,sx,sy,sz);
function curve(parent,key,points,r){
 const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),20,r,6,false);
 const m=new T.Mesh(g,mats[key]);m.userData.unique=true;parent.add(m);
}
function batch(group){
 const sets=new Map();
 for(const part of [...group.children]){
  if(!part.isMesh)continue;
  part.updateMatrix();
  const g=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
  g.applyMatrix4(part.matrix);
  const list=sets.get(part.material)||[];
  list.push(g);sets.set(part.material,list);
  group.remove(part);
  if(part.userData.unique)part.geometry.dispose();
 }
 for(const [material,parts] of sets){
  group.add(new T.Mesh(mergeGeometries(parts),material));
  parts.forEach(p=>p.dispose());
 }
}
function coat(parent){
 const g=new T.PlaneGeometry(1,1,18,13),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const u=p.getX(i)+.5,v=.5-p.getY(i);
  const a=(u-.5)*Math.PI*1.4;
  const width=.46-v*.09,fold=Math.cos(u*49+v*8)*.042;
  p.setXYZ(i,Math.sin(a)*width,Math.cos(a)*(.68-v*.1)+fold,-.13-v*1.37);
 }
 g.computeVertexNormals();
 const cloth=mats.ruby.clone();cloth.side=T.DoubleSide;
 const mesh=new T.Mesh(g,cloth);parent.add(mesh);
}
export function buildLion(scene){
 const root=new T.Group(),body=new T.Group(),head=new T.Group(),jaw=new T.Group(),ears=[],feet=[];
 root.userData.dynamic=true;root.visible=false;scene.add(root);
 root.add(body,head);head.add(jaw);jaw.position.set(0,-.19,.21);
 head.position.set(0,.27,.22);
 ball(head,'lacquer',0,.04,0,.53,.43,.49);
 ball(head,'dark',0,-.138,.251,.389,.18,.29);
 ball(head,'lacquer',0,-.111,.423,.335,.151,.214);
 ball(head,'jade',0,-.059,.591,.145,.113,.092);
 ball(head,'gold',0,-.032,.65,.048,.038,.02);
 for(const s of [-1,1]){
  ball(head,'gold',s*.133,-.137,.549,.068,.044,.053);
  ball(head,'cream',s*.39,-.012,.255,.107,.241,.19);
  ball(head,'orange',s*.426,.053,.331,.097,.112,.074);
  ring(head,'gold',s*.402,.052,.393,.065,.077,.038);
  ball(head,'lacquer',s*.244,.152,.352,.185,.177,.151);
  ring(head,'jade',s*.244,.15,.451,.147,.142,.11);
  ring(head,'gold',s*.244,.15,.468,.119,.117,.095);
  for(let i=0;i<8;i++){
   const a=i*Math.PI/7;
   ball(head,'cream',s*.244+Math.cos(a)*.137,.162+Math.sin(a)*.138,.447,.036,.045,.051).rotation.z=a;
  }
  const ear=new T.Group();ear.position.set(s*.43,.24,-.096);head.add(ear);
  ball(ear,'cream',s*.016,.041,-.019,.13,.134,.084).rotation.z=-s*.28;
  ball(ear,'lacquer',s*.036,.038,.041,.083,.086,.032);
  batch(ear);ears.push(ear);
  curve(head,'gold',[[s*.064,.27,.345],[s*.21,.345,.272],[s*.36,.28,.251],[s*.448,.171,.169]],.021);
  curve(head,'ink',[[s*.085,.258,.353],[s*.234,.336,.287],[s*.373,.273,.259]],.011);
  curve(head,'cream',[[s*.1,-.11,.566],[s*.231,-.158,.507],[s*.367,-.123,.37]],.02);
  for(let j=0;j<7;j++){
   const a=j*.34-.8;
   const tuft=ball(head,j%2?'cream':'tooth',s*(.395+.07*Math.sin(a)),-.046-j*.041,.255+j*.017,.049,.083,.063);
   tuft.rotation.z=s*(.36+j*.047);
  }
 }
 ball(head,'gold',0,.32,.298,.142,.123,.077);
 ring(head,'dark',0,.32,.369,.079,.08,.065);
 ball(head,'jade',0,.32,.392,.061,.059,.022);
 ball(head,'cream',-.015,.342,.409,.015,.015,.009);
 curve(head,'gold',[[0,.366,.04],[0,.52,.022],[0,.55,-.103],[0,.51,-.169]],.067);
 ball(head,'petal',0,.492,-.145,.075,.072,.074);
 ball(jaw,'lacquer',0,-.097,.239,.323,.082,.245);
 ball(jaw,'dark',0,-.048,.25,.292,.044,.21);
 ball(jaw,'orange',0,-.035,.32,.146,.032,.115);
 for(let i=-3;i<=3;i++){
  const z=.436-Math.abs(i)*.018;
  ball(jaw,'tooth',i*.071,-.025,z,.031,.042,.026);
  ball(head,'tooth',i*.07,-.188,z+.248,.03,.042,.024);
 }
 for(const s of [-1,1])for(let i=0;i<20;i++){
  const row=i%5,col=Math.floor(i/5);
  const tuft=ball(head,i%3?'cream':'tooth',s*(.382+row*.019),-.03-col*.047,.304-row*.009,.013,.064,.015);
  tuft.rotation.z=s*(.31+row*.14);
 }
 for(let i=-4;i<=4;i++){
  const tuft=ball(jaw,i%2?'cream':'tooth',i*.059,-.181,.405-Math.abs(i)*.013,.048,.112-Math.abs(i)*.009,.053);
  tuft.rotation.z=i*.078;
 }
 batch(jaw);batch(head);
 const pupils=[];
 for(const s of [-1,1]){
  const eye=new T.Group();eye.position.set(s*.243,.152,.467);head.add(eye);
  ball(eye,'tooth',0,0,0,.108,.107,.076);
  ball(eye,'ink',-s*.016,-.009,.063,.051,.059,.023);
  ball(eye,'cream',-s*.029,.021,.083,.015,.016,.008);
  batch(eye);pupils.push(eye);
 }
 const trim=new T.Group();
 body.add(trim);
 for(let j=0;j<6;j++)for(const s of [-1,1]){
  const z=-.14-j*.221,x=s*(.445-j*.012);
  const r=ring(trim,j%2?'gold':'orange',x,.35+(j%2)*.037,z,.089,.114,.049);
  r.rotation.y=s*1.1;
  ball(trim,'cream',x,.257,z,.069,.084,.059);
  ball(trim,'petal',s*.145,.665-j*.017,z,.114,.031,.052);
 }
 batch(trim);coat(body);
 const tail=new T.Group();tail.position.set(0,.37,-1.44);body.add(tail);
 curve(tail,'gold',[[0,.03,0],[0,.13,-.17],[0,.26,-.32],[0,.22,-.45]],.035);
 ball(tail,'cream',0,.226,-.455,.067,.069,.114);batch(tail);
 for(const [i,z] of [.03,-.98].entries())for(const s of [-1,1]){
  const leg=new T.Group();root.add(leg);
  leg.position.set(s*.225,-.47,z);
  put(leg,round,'dark',0,-.045,0,.084,.56,.092);
  ball(leg,'orange',0,-.29,.038,.103,.077,.146);
  ball(leg,'gold',0,-.285,.091,.104,.039,.111);
  batch(leg);feet.push({leg,i,s});
 }
 const bodyPosition=root.position;
 bodyPosition.set(LION_POINT.x,.98,LION_POINT.z);
 bodyPosition.radius=1.4;
 function update(time,visible,reduced,blocked){
  root.visible=visible;
  if(!visible)return;
  const t=reduced?0:time*.001;
  const step=t*6.2,beat=time/BEAT_MS;
  const hop=reduced?0:Math.pow(Math.max(0,Math.sin(step)),3)*.12+Math.pow(Math.max(0,Math.sin(t*1.42)),7)*.23;
  const x=LION_POINT.x+Math.sin(t*.47)*.67,z=LION_POINT.z+Math.sin(t*.32)*1.16;
  if(!blocked(bodyPosition,x,z))bodyPosition.set(x,.98+hop,z);
  else bodyPosition.y=.98+hop;
  root.rotation.y=.49+Math.sin(t*.67)*.77;
  head.rotation.set(Math.sin(step)*.09-Math.sin(t*1.42)**4*.18,Math.sin(t*1.64)*.19,Math.sin(step*.6)*.07);
  jaw.rotation.x=.09+(reduced?0:Math.max(0,Math.sin(beat*Math.PI*2))*.26);
  body.rotation.set(-hop*.22,0,Math.sin(step)*.05);
  tail.rotation.z=Math.sin(step*.64)*.32;
  for(const [i,e] of ears.entries())e.rotation.z=Math.sin(step+i*.6)*.16;
  for(const eye of pupils)eye.scale.y=!reduced&&Math.floor(t*10)%43===0?.18:1;
  for(const {leg,i,s} of feet)leg.rotation.x=Math.sin(step+i*1.7+s*Math.PI*.45)*.27;
 }
 return {update,body:bodyPosition,root};
}
