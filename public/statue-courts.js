import * as T from './vendor/three.module.js';
import {ARHATS,GALLERY,GALLERY_POSTS,COMPASSION,TAM_THE,TAM_THE_POSTS,REAR_PLANTERS,REAR_LAMPS} from './precinct-layout.js?v=precinct-1';

export function buildStatueCourts({scene,box,cylinder,tube,mesh,mat,wood,woodLight,stone,stoneLight,warm,roof,walk,pave,plaque}){
 const bronze=mat('tam-the-bronze','#aa743a',{metalness:.54,roughness:.46});
 const white=mat('quan-am-stone','#d9d6ca',{roughness:.78});
 const granite=['#898b80','#aaa99e','#a29b89','#989589'].map(color=>mat('la-han-'+color,color));
 const oval=new T.SphereGeometry(1,12,9);
 function ellipsoid(x,y,z,rx,ry,rz,material,parent){
  const part=mesh(oval,material,parent);
  part.position.set(x,y,z);
  part.scale.set(rx,ry,rz);
  return part;
 }
 function robe(profile,depth,folds,material,parent){
  const geometry=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),40);
  const vertices=geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
   const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i),angle=Math.atan2(z,x);
   const drape=1+folds*(Math.cos(angle*9+y*2.7)+.37*Math.sin(angle*15-y*2));
   vertices.setXYZ(i,x*drape,y,z*drape*depth);
  }
  geometry.computeVertexNormals();
  return mesh(geometry,material,parent);
 }
 function limb(a,b,rx,rz,material,parent){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),middle=start.clone().lerp(end,.5);
  const part=ellipsoid(...middle.toArray(),rx,start.distanceTo(end)*.67,rz,material,parent);
  part.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());
 }
 function face(y,width,material,parent,kind,tilt=0){
  const g=new T.Group();g.position.y=y;g.rotation.z=tilt;g.scale.setScalar(width);parent.add(g);
  ellipsoid(0,.01,0,.22,.284,.197,material,g);
  ellipsoid(0,-.14,.046,.163,.138,.145,material,g);
  for(const side of [-1,1]){
   ellipsoid(side*.204,-.039,-.003,.047,.111,.048,material,g);
   ellipsoid(side*.092,.042,.169,.077,.029,.031,material,g).rotation.z=side*.11;
   tube([[side*.04,.006,.186],[side*.085,-.008,.193],[side*.14,.005,.167]],.007,material,g);
  }
  ellipsoid(0,-.037,.194,.041,.072,.041,material,g);
  ellipsoid(0,-.12,.17,.069,.018,.022,material,g);
  if(kind==='buddha'){
   ellipsoid(0,.192,-.018,.222,.144,.193,material,g);
   ellipsoid(0,.31,-.024,.098,.105,.087,material,g);
   for(let i=0;i<17;i++){
    const a=i/17*Math.PI*2;
    ellipsoid(.19*Math.sin(a),.228,.158*Math.cos(a),.033,.032,.031,material,g);
   }
  }else if(kind==='crown'){
   robe([[.21,.13],[.22,.21],[.177,.34],[.12,.42],[.085,.44]],.84,.032,material,g);
   ellipsoid(0,.293,.173,.046,.065,.025,material,g);
  }
 }
 function lotusBase(radius,y,material,parent){
  cylinder(radius,radius*.88,.32,0,y,0,material,parent,36);
  cylinder(radius*.91,radius*.78,.27,0,y+.27,0,material,parent,36);
  for(let i=0;i<18;i++){
   const a=i/18*Math.PI*2;
   const petal=ellipsoid(radius*.93*Math.sin(a),y+.18,radius*.93*Math.cos(a),radius*.14,.24,radius*.10,material,parent);
   petal.rotation.set(-.34,a,0,'YXZ');
  }
 }
 function sculpture(x,y,z,angle,scale,material,kind,variation=0){
  const group=new T.Group();group.position.set(x,y,z);group.rotation.y=angle;group.scale.setScalar(scale);scene.add(group);
  const seated=kind==='buddha'||variation%3===0&&kind==='arhat';
  const height=seated?1.39:2.08;
  if(seated){
   ellipsoid(-.28,.21,.10,.39,.21,.38,material,group);
   ellipsoid(.28,.21,.10,.39,.21,.38,material,group);
  }
  robe(seated?[[.57,0],[.61,.16],[.48,.36],[.33,.61],[.315,.92],[.32,1.04],[.23,1.16],[.125,1.23]]:
   [[.39,0],[.44,.13],[.39,.41],[.31,.78],[.29,1.13],[.275,1.52],[.32,1.69],[.28,1.83],[.12,1.94]],seated?.72:.73,.075,material,group);
  cylinder(.105,.132,.21,0,height-.195,0,material,group);
  face(height,kind==='compassion'?.94:1,material,group,kind==='compassion'?'crown':kind,kind==='arhat'?(variation%5-2)*.043:0);
  const shoulders=seated?1.015:1.72;
  const poses=seated?[
   [[-.15,.35,.39],[.15,.35,.39]],
   [[-.16,.55,.33],[.35,.81,.29]],
   [[-.04,.47,.39],[.04,.47,.39]]
  ]:[
   [[-.055,1.38,.32],[.055,1.38,.32]],
   [[-.40,.98,.32],[.37,1.51,.31]],
   [[-.41,1.62,.30],[.11,1.22,.33]],
   [[-.20,1.03,.34],[.24,1.30,.31]],
   [[-.22,1.26,.36],[.40,1.46,.26]],
   [[-.35,1.46,.32],[.34,1.09,.31]]
  ];
  const hands=kind==='compassion'?[[-.29,1.27,.36],[.35,1.62,.29]]:
   poses[(seated&&kind==='arhat'?Math.floor(variation/3):variation)%poses.length];
  for(const side of [-1,1]){
   const hand=hands[(side+1)/2],elbow=[side*.36,shoulders-.40,.12];
   limb([side*.245,shoulders,0],elbow,.132,.123,material,group);
   limb(elbow,hand,.108,.103,material,group);
   ellipsoid(...hand,.069,.102,.052,material,group);
  }
  const collar=seated?[[.15,1.22,.02],[.21,1.07,.19],[.065,.88,.24],[-.22,.66,.22]]:
   [[.15,1.94,.02],[.24,1.79,.15],[.075,1.48,.235],[-.19,1.26,.21]];
  tube(collar,.024,material,group);
  if(!seated&&kind==='arhat'&&variation%6===2){
   const [sx,,sz]=hands[0];
   cylinder(.027,.033,1.99,sx,1.01,sz+.035,material,group,9);
   ellipsoid(sx,2.04,sz+.035,.07,.11,.042,material,group);
  }
  if(kind==='arhat'&&variation%6===4){
   for(let i=0;i<10;i++){
    const a=i/10*Math.PI*2;
    ellipsoid(-.24+Math.sin(a)*.082,1.15+Math.cos(a)*.12,.376,.022,.025,.021,material,group);
   }
  }
  if(kind==='compassion'){
   const vase=robe([[.07,1.20],[.115,1.25],[.12,1.36],[.06,1.45],[.051,1.50],[.079,1.51]],1,0,material,group);
   vase.position.set(-.29,0,.37);
   for(const side of [-1,1])tube([[side*.17,1.96,-.045],[side*.30,1.64,-.10],[side*.35,1.25,-.11],[side*.28,.72,-.12],[side*.42,.17,.01]],.039,material,group);
  }
 }
 // Outer stone wings and continuous cross-courts widen the walking circuit.
 pave(139,24,0,1,.119,true);
 pave(182,25,0,-95,.121,true);
 pave(170,31,0,-123,.123,true);
 pave(111,23,0,-149,.127,true);
 for(const side of [-1,1]){
  pave(13.4,150,side*77,-79,.130,true);
  for(const z of GALLERY.centres){
   const g=new T.Group();g.position.set(side*GALLERY.x,0,z);scene.add(g);
   pave(GALLERY.halfWidth*2,GALLERY.halfDepth*2,side*GALLERY.x,z,.15,true);
   const canopy=new T.Group();canopy.rotation.y=Math.PI/2;g.add(canopy);
   roof(54,12.8,6.7,canopy,false);
   for(const dx of [-4.5,4.5])box(.36,.42,52,dx,4.83,0,wood,g);
   plaque('Hành lang La Hán',0,4.25,26,6.7,g);
  }
 }
 for(const [x,z] of GALLERY_POSTS){
  cylinder(.29,.34,.32,x,.3,z,stone,scene,12);
  cylinder(.15,.19,4.38,x,2.6,z,wood,scene,12);
 }
 for(const {x,z,side,variant} of ARHATS){
  box(2.06,.31,2.26,x,.305,z,stone);
  box(1.82,.24,1.99,x,.58,z,stoneLight);
  const style=variant+(side>0?2:0);
  sculpture(x,.70,z,-side*Math.PI/2+(variant%3-1)*.045,1+(variant%5)*.035,granite[variant%4],'arhat',style);
 }

 const foliage=mat('rear-hedge','#5e703f'),flower=mat('rear-flower','#a96c6a'),soil=mat('rear-soil','#585144');
 for(const [x,z] of REAR_PLANTERS){
  box(10,.34,3,x,.32,z,stoneLight);
  box(9.62,.1,2.62,x,.48,z,soil);
  for(let i=0;i<9;i++){
   const dx=(i-4)*1.02,dz=Math.sin(i*2.5)*.50;
   ellipsoid(x+dx,.63,z+dz,.65,.36,.61,foliage,scene);
   ellipsoid(x+dx+.23,.85,z+dz+.17,.15,.13,.17,flower,scene);
  }
 }
 for(const [x,z] of REAR_LAMPS){
  box(1.04,.31,1.04,x,.3,z,stone);
  box(.42,1.18,.42,x,1.02,z,stoneLight);
  box(.89,.13,.89,x,1.63,z,stone);
  box(.48,.48,.48,x,1.92,z,warm);
  cylinder(.18,.65,.44,x,2.37,z,stone,scene,4).rotation.y=Math.PI/4;
 }

 const court=new T.Group();court.position.set(COMPASSION.x,0,COMPASSION.z);scene.add(court);
 cylinder(4.8,COMPASSION.radius,.52,0,.38,0,stone,court,48);
 cylinder(4.45,4.62,.42,0,.83,0,stoneLight,court,48);
 cylinder(3.8,4.34,.55,0,1.31,0,stone,court,48);
 lotusBase(3.56,1.72,white,court);
 sculpture(COMPASSION.x,2.1,COMPASSION.z,0,3.7,white,'compassion');
 plaque('Sân Quan Âm',0,1.02,4.62,4.2,court);

 const {z,width,depth,floor,stepsFront}=TAM_THE,front=z+depth/2;
 const hall=new T.Group();hall.position.z=z;scene.add(hall);
 walk(box(width,floor,depth,0,floor/2,0,stoneLight,hall));
 for(let i=0;i<6;i++){
  const stepDepth=(stepsFront-front)/6,top=.15+(floor-.15)*(i+1)/6;
  walk(box(14,top,stepDepth,0,top/2,stepsFront-(i+.5)*stepDepth-z,stone,hall));
 }
 const wall=mat('tam-the-wall','#77614f');
 box(width,8.75,.46,0,5.69,-10,wall,hall);
 for(const x of [-18,18])box(.46,8.75,depth,x,5.69,0,wall,hall);
 for(const x of [-12.5,12.5])box(11,1.13,.56,x,1.89,10,stone,hall);
 for(const [x,zz] of TAM_THE_POSTS){
  cylinder(.44,.5,.4,x,1.51,zz,stone);
  cylinder(.25,.31,7.3,x,5.18,zz,wood);
 }
 box(36,.65,.55,0,8.66,8.8,woodLight,hall);
 box(36,.17,.32,0,10.02,9.0,wood,hall);
 for(let x=-17.5;x<18;x+=.65)box(.105,1.12,.24,x,9.47,9,wood,hall);
 for(const x of [-7.55,7.55]){
  const rail=[];
  for(let i=0;i<4;i++){
   const zz=stepsFront-i*(stepsFront-front)/3;
   const y=.15+i*(floor-.15)/3;
   box(.56,.9,.56,x,y+.45,zz,stoneLight);
   rail.push([x,y+.73,zz]);
  }
  tube(rail,.15,stoneLight);
 }
 roof(42,25,11.9,hall,false);
 box(28,1.9,13,0,11.85,0,wood,hall);
 roof(33,17,14.45,hall,false);
 plaque('Điện Tam Thế',0,8.45,9.22,7.7,hall);
 for(const [i,x] of [-12,0,12].entries()){
  const altar=new T.Group();altar.position.set(x,floor,z-2.8);scene.add(altar);
  box(6.8,.57,5,0,.285,0,stone,altar);
  lotusBase(2.42,.75,bronze,altar);
  sculpture(x,floor+1.17,z-2.8,0,i===1?3.1:2.85,bronze,'buddha',i);
 }
 return ARHATS.length+4;
}
