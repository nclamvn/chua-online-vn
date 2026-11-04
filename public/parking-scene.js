import * as T from './vendor/three.module.js';
import {PARKED_CARS,PARKING_LOT,PARKING_LAMPS,PARKING_SIGN,PARKING_DRIVE,ARRIVING_CARS} from './parking-layout.js';

// Cross sections run from the rear bumper to the nose (+Z). Each station
// gives length fraction, width fraction, shoulder height and top height.
const profiles={
 limousine:{
  lower:[[-.5,.88,.63,.78],[-.44,1,.78,.98],[-.26,1,.84,1.02],[.26,1,.84,1.02],[.45,.94,.79,.99],[.5,.85,.69,.91]],
  cabin:[[-.35,.76,.92,1.01],[-.22,.89,1,1.49],[-.08,.89,1,1.64],[.13,.83,1,1.59],[.24,.86,1,1.02]],roof:[-.08,.13,1.64,1.59,.76],
 },
 wedge:{
  lower:[[-.5,.88,.49,.69],[-.43,1,.72,.84],[-.21,1,.71,.82],[.22,.94,.56,.69],[.45,.91,.45,.58],[.5,.8,.36,.48]],
  cabin:[[-.36,.72,.78,.83],[-.19,.8,.76,1.12],[-.05,.8,.72,1.24],[.11,.77,.68,1.14],[.26,.75,.62,.68]],roof:[-.05,.105,1.24,1.15,.65],
 },
 gt:{
  lower:[[-.5,.85,.54,.68],[-.42,1,.69,.87],[-.23,1,.7,.88],[.18,.92,.67,.82],[.43,.96,.58,.7],[.5,.82,.45,.57]],
  cabin:[[-.38,.73,.78,.85],[-.21,.84,.82,1.16],[-.08,.84,.82,1.3],[.09,.79,.79,1.25],[.23,.77,.76,.83]],roof:[-.11,.08,1.29,1.26,.65],
 },
 sedan:{
  lower:[[-.5,.85,.57,.72],[-.42,.98,.71,.86],[-.19,1,.73,.89],[.2,.98,.71,.87],[.43,.95,.63,.79],[.5,.86,.53,.69]],
  cabin:[[-.34,.8,.81,.87],[-.19,.85,.85,1.32],[-.05,.85,.87,1.45],[.12,.82,.86,1.41],[.25,.83,.83,.88]],roof:[-.08,.11,1.43,1.42,.69],
 },
 suv:{
  lower:[[-.5,.87,.59,.85],[-.43,1,.82,1.03],[-.19,1,.84,1.05],[.19,1,.83,1.05],[.44,.94,.77,.99],[.5,.85,.64,.87]],
  cabin:[[-.46,.84,.96,1.12],[-.35,.88,1,1.66],[-.23,.88,1,1.77],[.1,.87,1,1.72],[.23,.89,1,1.05]],roof:[-.26,.1,1.76,1.72,.77],
 },
};

function loft(stations,width,length,bottom){
 const vertices=[],indices=[],segments=8;
 for(const [z,ratio,shoulder,top] of stations){
  const half=width*ratio/2;
  for(const [x,y] of [[-.84,bottom],[.84,bottom],[1,bottom+(shoulder-bottom)*.28],[1,shoulder],[.78,top],[-.78,top],[-1,shoulder],[-1,bottom+(shoulder-bottom)*.28]]){
   vertices.push(x*half,y,z*length);
  }
 }
 const end=(stations.length-1)*segments;
 for(let i=0;i<end;i++){
  const next=i-i%segments+(i+1)%segments;
  indices.push(i,next,next+segments,i,next+segments,i+segments);
 }
 for(let i=1;i<segments-1;i++)indices.push(0,i+1,i,end,end+i,end+i+1);
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();
 return geometry;
}

export function buildParking({scene,box,cylinder,ball,mesh,mat,walk}){
 const {x,z,width,depth}=PARKING_LOT;
 const asphaltCanvas=document.createElement('canvas');asphaltCanvas.width=asphaltCanvas.height=128;
 const ctx=asphaltCanvas.getContext('2d'),pixels=ctx.createImageData(128,128);
 let noise=73;
 for(let i=0;i<pixels.data.length;i+=4){
  noise=(Math.imul(noise,1664525)+1013904223)>>>0;
  const n=64+(noise>>>27);
  pixels.data[i]=n;pixels.data[i+1]=n+2;pixels.data[i+2]=n+1;pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);
 const texture=new T.CanvasTexture(asphaltCanvas);texture.colorSpace=T.SRGBColorSpace;
 texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(13,13);
 const asphalt=mat('parking-asphalt','#ffffff',{map:texture,roughness:1});
 const stripe=mat('parking-stripe','#e9dfbf'),rubber=mat('parking-rubber','#191b1d',{roughness:.9});
 const chrome=mat('parking-chrome','#bac2c3',{metalness:.92,roughness:.24});
 const trim=mat('parking-trim','#222a2e',{roughness:.45,metalness:.34});
 const glass=mat('parking-glass','#202d36',{roughness:.16,metalness:.58});
 const headlamp=mat('parking-headlight','#e2f6ff',{emissive:'#bddcff',emissiveIntensity:.36});
 const taillamp=mat('parking-taillight','#a1211c',{emissive:'#8c2119',emissiveIntensity:.42});
 const pole=mat('parking-lamp-post','#4d5550',{metalness:.56});
 const bulb=mat('parking-lamp-bulb','#fff2d0',{emissive:'#ffdda0',emissiveIntensity:1.1});
 walk(box(width,.16,depth,x,.06,z,asphalt));
 walk(box(3,.14,4.8,67.25,.07,z,asphalt));
 const eastEdge=x+width/2,roadLength=PARKING_DRIVE.start+4-eastEdge;
 walk(box(roadLength,.16,5.5,eastEdge+roadLength/2,.06,z,asphalt));
 for(let line=eastEdge+1;line<PARKING_DRIVE.start;line+=4)box(1.5,.012,.09,line,.148,z,stripe);
 for(const side of [-1,1]){
  const row=z+side*8.5;
  for(let i=0;i<=10;i++)box(.085,.012,6.2,x+(i-5)*2.72,.148,row,stripe);
  box(27.3,.012,.075,x,.148,row+side*3.1,stripe);
 }
 for(let i=0;i<8;i++)box(1.12,.012,.085,x-11.9+i*3.4,.148,z,stripe);
 for(const [lx,lz] of PARKING_LAMPS){
  cylinder(.11,.16,4.65,lx,2.42,lz,pole);
  box(1.15,.08,.26,lx+.36,4.71,lz,pole);
  box(.63,.025,.18,lx+.57,4.65,lz,bulb);
 }
 const sign=document.createElement('canvas');sign.width=384;sign.height=160;
 const ink=sign.getContext('2d');ink.fillStyle='#233c34';ink.fillRect(0,0,384,160);
 ink.strokeStyle='#b6aa83';ink.lineWidth=4;ink.strokeRect(8,8,368,144);
 ink.fillStyle='#f7efd8';ink.font='bold 54px sans-serif';ink.fillText('P',25,94);
 ink.font='600 36px sans-serif';ink.fillText('BÃI ĐỖ XE',96,92);
 const signMap=new T.CanvasTexture(sign);signMap.colorSpace=T.SRGBColorSpace;
 cylinder(.09,.11,2.1,PARKING_SIGN.x,1.17,PARKING_SIGN.z,pole);
 const board=box(2.55,1.06,.09,PARKING_SIGN.x,2.15,PARKING_SIGN.z,mat('parking-sign','#ffffff',{map:signMap}));
 board.rotation.y=-.65;
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
 const shadowCtx=shadowCanvas.getContext('2d'),shade=shadowCtx.createRadialGradient(32,32,9,32,32,32);
 shade.addColorStop(0,'#07110ee0');shade.addColorStop(.6,'#07110e90');shade.addColorStop(1,'#07110e00');
 shadowCtx.fillStyle=shade;shadowCtx.fillRect(0,0,64,64);
 const shadow=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),PARKED_CARS.length);
 const transform=new T.Object3D();transform.rotation.x=-Math.PI/2;
 scene.add(shadow);
 const geometries=Object.fromEntries(Object.entries(profiles).map(([style,profile])=>{
  const sample=PARKED_CARS.find(car=>car.style===style),{width,length}=sample;
  const [rear,front,y0,y1,w]=profile.roof;
  const base=style==='suv'?1.01:style==='limousine'?.97:style==='sedan'?.85:.76;
  return [style,[
   loft(profile.lower,width,length,style==='suv'?.33:.24),
   loft(profile.cabin,width,length,base),
   loft([[rear,w,y0-.055,y0+.025],[front,w,y1-.055,y1+.025]],width,length,Math.min(y0,y1)-.09),
  ]];
 }));
 for(const [i,car] of PARKED_CARS.entries()){
  const {x,z,yaw,width,length}=car;
  transform.position.set(x,.156,z);transform.scale.set(width*1.48,length*1.25,1);transform.updateMatrix();shadow.setMatrixAt(i,transform.matrix);
  buildCar(car,yaw,false);
 }
 function buildCar(car,yaw,dynamic){
  const {x,z,width,length,color,style}=car;
  const group=new T.Group();group.position.set(x,.14,z);group.rotation.y=yaw;group.userData.dynamic=dynamic;scene.add(group);
  const paint=mat('parking-paint-'+color,color,{metalness:.52,roughness:.25});
  const luxury=style==='limousine',sport=style==='gt'||style==='wedge',suv=style==='suv';
  const [body,cabin,roof]=geometries[style];
  mesh(body,paint,group);mesh(cabin,glass,group);mesh(roof,luxury?chrome:paint,group);
  const radius=suv?.41:sport?.35:.37;
  const wheels=[];
  for(const side of [-1,1]){
   const wheelX=side*width*.456;
   for(const axle of [-1,1]){
    const axleZ=axle*length*.313;
    const wheel=new T.Group();wheel.position.set(wheelX,radius,axleZ);group.add(wheel);
    const tire=cylinder(radius,radius,.265,0,0,0,rubber,wheel,18);
    const rim=cylinder(radius*.7,radius*.7,.022,side*.14,0,0,chrome,wheel,12);
    const hub=cylinder(radius*.24,radius*.24,.027,side*.153,0,0,trim,wheel,10);
    for(const part of [tire,rim,hub])part.rotation.z=Math.PI/2;
    if(dynamic){
     for(let spoke=0;spoke<5;spoke++){
      const angle=spoke*Math.PI*2/5;
      const detail=box(.02,.043,radius*.30,side*.157,Math.sin(angle)*radius*.43,Math.cos(angle)*radius*.43,trim,wheel);
      detail.rotation.x=-angle;
     }
     wheels.push(wheel);
    }
   }
   box(.13,.07,length*.43,side*width*.49,.40,-.07,trim,group);
   box(.21,.12,.24,side*width*.49,sport?.87:1.06,length*.14,paint,group);
   box(.17,.105,.024,side*width*.53,sport?.87:1.06,length*.14-.12,glass,group);
   box(.035,.035,.16,side*width*.48,sport?.68:.86,length*.03,chrome,group);
   const head=box(sport?.38:.33,sport?.06:.12,.045,side*width*.32,luxury?.78:suv?.79:sport?.50:.63,length*.497,headlamp,group);
   head.rotation.y=side*(sport?.22:.08);
   box(.37,.085,.04,side*width*.29,suv?.73:.57,-length*.499,taillamp,group);
  }
  box(width*.7,.12,.08,0,.38,length*.493,trim,group);
  box(width*.72,.08,.08,0,.38,-length*.498,luxury?chrome:trim,group);
  if(luxury){
   // Upright polished grille and long bonnet evoke a classic luxury limousine.
   box(.71,.44,.10,0,.69,length*.496,chrome,group);
   box(.61,.36,.025,0,.69,length*.496+.057,trim,group);
   for(let bar=-5;bar<=5;bar++)box(.016,.36,.032,bar*.051,.69,length*.496+.074,chrome,group);
   ball(.04,.075,.04,0,1.00,length*.473,chrome,group);
  }else if(style==='wedge'){
   box(width*.81,.065,.31,0,.84,-length*.45,trim,group);
  }
  if(!dynamic)return;
  const door=new T.Group();
  door.position.set(width*.49,.57,length*.225);
  group.add(door);
  box(.085,.36,.97,0,0,-.485,paint,door);
  box(.055,.19,.87,0,.252,-.49,glass,door);
  box(.075,.028,.16,.046,.14,-.78,chrome,door);
  door.visible=false;
  const contact=new T.Mesh(shadow.geometry,shadow.material);
  contact.rotation.x=-Math.PI/2;
  contact.scale.set(width*1.48,length*1.25,1);
  scene.add(contact);
  group.visible=false;contact.visible=false;
  return {
   setDoor(amount){door.visible=amount>.01;door.rotation.y=-amount*.48},
   setPose(pose,distance=0){
    group.visible=contact.visible=!!pose;
    if(!pose)return;
    group.position.set(pose.x,.14,pose.z);group.rotation.y=pose.yaw;
    contact.position.set(pose.x,.156,pose.z);contact.rotation.z=-pose.yaw;
    for(const wheel of wheels)wheel.rotation.x+=distance/radius;
   },
  };
 }
 shadow.instanceMatrix.needsUpdate=true;
 return {count:PARKED_CARS.length,cars:ARRIVING_CARS.map(car=>buildCar(car,0,true))};
}
