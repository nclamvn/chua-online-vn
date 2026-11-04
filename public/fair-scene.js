import {steer,BODY_RADIUS} from './body-collision.js?v=hoi-rong-1';
import {buildLion} from './lion-dance.js';
import * as T from './vendor/three.module.js';
import {createVisitor} from './avatar.js';
import {COSTUMES,FAIR_BUNTING_ROWS,LION_POINT,MARKET_CARTS,MARKET_STALLS,stallFront} from './fair-catalog.js?v=hoi-rong-1';
import {groundHeight,validPosition,ZONES} from './world-rules.js?v=hoi-rong-1';

function signTexture(title,background){
 const canvas=document.createElement('canvas');
 canvas.width=512;canvas.height=112;
 const c=canvas.getContext('2d');
 c.fillStyle=background;c.fillRect(0,0,512,112);
 c.strokeStyle='#e8c881';c.lineWidth=3;c.strokeRect(12,12,488,88);
 c.fillStyle='#fff1ca';c.font='bold 43px Georgia';c.textAlign='center';c.textBaseline='middle';
 c.fillText(title,256,58,453);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;return map;
}
function tentCloth(color){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
 const c=canvas.getContext('2d');
 c.fillStyle=color;c.fillRect(0,0,256,128);
 for(let i=0;i<256;i+=64){
  c.fillStyle='#dfbc7e';c.fillRect(i,0,12,128);
  c.fillStyle='#f5dda0';c.fillRect(i+12,0,3,128);
 }
 for(let y=0;y<128;y+=2){
  c.fillStyle=y%4?'#00000014':'#ffffff1c';c.fillRect(0,y,256,1);
 }
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 return new T.MeshStandardMaterial({map,roughness:1,side:T.DoubleSide});
}
function roofPanel(cloth,parent,side){
 const geometry=new T.PlaneGeometry(5.95,2.43,28,8);
 const p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){
  const u=p.getX(i),v=(p.getY(i)+1.215)/2.43;
  p.setXYZ(i,u,3.72-.83*v-Math.sin(Math.PI*v)*.14+Math.cos(u*13)*.018,side*v*2.23);
 }
 geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,cloth);mesh.castShadow=true;parent.add(mesh);
}
const actorStyle=costume=>({outfit:costume.id,profile:costume.profile,hair:costume.hair});

export function buildFair({scene,box,cylinder,ball,tube,mat,action,wood,woodLight,gold,warm}){
 const root=new T.Group();
 scene.add(root);
 const lion=buildLion(scene),parade=[];
 const route=new T.CatmullRomCurve3([[-1.6,69],[-1.9,81],[-1.6,93],[0,96],[1.8,93],[2.1,81],[1.7,69],[0,66]].map(([x,z])=>new T.Vector3(x,0,z)),true);
 const routeLength=route.getLength(),startDistance=18;
 const wrap=value=>((value%routeLength)+routeLength)%routeLength;
 const paradeDistance=(now,reduced)=>startDistance+(reduced?0:now*.0014);
 function paradeSample(distance){
  const u=wrap(distance)/routeLength,point=route.getPointAt(u),heading=route.getTangentAt(u);
  return {point,heading};
 }
 function paradeCamera(now,reduced,portrait){
  const {point,heading}=paradeSample(paradeDistance(now,reduced)-2.1);
  const ahead=portrait?9.8:6,side=portrait?5.8:4.2;
  return {
   position:[point.x+heading.x*ahead+heading.z*side,portrait?3.9:3.5,point.z+heading.z*ahead-heading.x*side],
   target:[point.x,1.16,point.z]
  };
 }
 const red=mat('#a53830'),jade=mat('#39756a'),ochre=mat('#c28b39'),ink=mat('#2c3234');
 const pale=mat('#ddc99a'),glaze=mat('#548c80'),cream=mat('#e4d3a5'),leaf=mat('#526736');
 const colors=[red,ochre,jade,pale],fabrics=new Map(),actors=[],flags=[],steam=[];
 const festivalColors=['#bc382c','#e6a333','#2e8e7d','#bd506c','#3b78aa','#e9c76d'];
 const paper=festivalColors.map(color=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.16,roughness:.86}));
 const timber=mat('#563c2e'),carpet=mat('#a24d36');
 const textureMaps=[];
 const origin=ZONES.market.point;
 function addSign(name,color,w,h,x,y,z,parent){
  const map=signTexture(name,color);textureMaps.push(map);
  const material=new T.MeshStandardMaterial({map,roughness:.95,side:T.DoubleSide});
  const sign=new T.Mesh(new T.PlaneGeometry(w,h),material);
  sign.position.set(x,y,z);parent.add(sign);
  return sign;
 }
 function fabric(color){
  if(!fabrics.has(color)){
   const m=tentCloth(color);fabrics.set(color,m);textureMaps.push(m.map);
  }
  return fabrics.get(color);
 }
 function lantern(x,y,z,r,color,parent){
  tube([[x,y+.58,z],[x,y+.26,z]],.016,wood,parent);
  ball(r,r*1.13,r,x,y,z,color,parent);
  cylinder(r*.5,r*.52,.065,x,y+r*1.04,z,gold,parent,10);
  cylinder(r*.5,r*.5,.05,x,y-r*1.06,z,gold,parent,10);
  cylinder(.012,.035,.17,x,y-r*1.13-.08,z,gold,parent,6);
 }
 function actor(appearance){
  const rig=createVisitor({npc:true,detail:'far',appearance,castShadow:false});
  rig.root.visible=false;root.add(rig.root);return rig;
 }
 function pennants(z){
  const lift=z===107?3.65:z===101?1.9:0;
  const positions=[],indices=[],rgb=[];
  const c=new T.Color();
  for(let i=0;i<16;i++){
   const x=-7.9+i*1.03,y=5.05+lift+.026*x*x;
   const k=positions.length/3;
   positions.push(x-.39,y+.027*x*.78,0,x+.39,y-.027*x*.78,0,x,y-.62,0);
   indices.push(k,k+1,k+2);
   c.set(['#a7392b','#c59a4c','#32796e','#dfbe84','#775789'][i%5]);
   for(let j=0;j<3;j++)rgb.push(c.r,c.g,c.b);
  }
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new T.Float32BufferAttribute(rgb,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
  const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:1}));
  mesh.userData.dynamic=true;mesh.position.z=z;root.add(mesh);flags.push(mesh);
  const cable=Array.from({length:17},(_,i)=>{const x=-8+i;return [x,5.08+lift+.026*x*x,z]});
  tube(cable,.019,timber,root);
  const row=FAIR_BUNTING_ROWS.indexOf(z);
  for(let i=0;i<6;i++){
   const x=(i-2.5)*2.38;
   lantern(x,4.67+lift+.026*x*x,z,.14+(i+row)%3*.027,paper[(i+row)%paper.length],root);
  }
  for(const x of [-8,8])cylinder(.075,.09,6.76+lift,x,3.38+lift/2,z,timber,root,8);
 }
 function stock(s,p){
  if(s.type==='food'){
   for(let i=0;i<9;i++){
    const x=(i%3)*.39-2,z=.49+Math.floor(i/3)*.34;
    box(.3,.14,.29,x,1.25,z,leaf,p);
    box(.025,.148,.3,x,1.25,z,pale,p);box(.31,.148,.023,x,1.25,z,pale,p);
   }
   for(let i=0;i<3;i++)cylinder(.51,.53,.15,1.35,1.29+i*.135,.9,woodLight,p,20);
   ball(.53,.14,.53,1.35,1.67,.9,pale,p);cylinder(.08,.1,.07,1.35,1.81,.9,wood,p,12);
   steam.push(new T.Vector3(1.35,1.85,.9).applyMatrix4(p.matrixWorld));
  }else if(s.type==='tea'){
   for(let i=0;i<5;i++){
    const x=(i-2)*.82;
    ball(.27,.3,.27,x,1.47,.62,i%2?cream:glaze,p);
    cylinder(.15,.17,.17,x,1.72,.62,i%2?cream:glaze,p,16);
    cylinder(.195,.2,.035,x,1.83,.62,gold,p,16);
    cylinder(.103,.078,.105,x+.2,1.245,1.23,cream,p,12);
   }
  }else if(s.type==='toys'){
   for(let i=0;i<17;i++){
    const x=(i%6-2.5)*.65,z=.52+Math.floor(i/6)*.36,y=1.62+(i%3)*.14;
    cylinder(.012,.012,y-1.12,x,(y+1.12)/2,z,woodLight,p,6);
    ball(.13,.105,.072,x,y,z,colors[i%4],p);
    ball(.071,.091,.068,x+.08,y+.072,z,colors[(i+1)%4],p);
    ball(.024,.026,.015,x+.102,y+.093,z+.061,ink,p);
   }
  }else if(s.type==='lanterns'){
   for(let i=0;i<7;i++){
    lantern((i-3)*.73,2.04+(i%2)*.23,1.28,.24+(i%3)*.045,colors[i%4],p);
   }
   for(let i=0;i<5;i++)ball(.23,.15,.2,(i-2)*.86,1.32,.8,colors[(i+2)%4],p);
  }else if(s.type==='letters'){
   for(const [i,name] of ['AN','TÂM','HÒA'].entries()){
    const x=(i-1)*1.31;
    box(.82,1.17,.043,x,2.07,-1.32,cream,p);
    addSign(name,'#8a3d36',.65,.57,x,2.1,-1.293,p);
    cylinder(.043,.043,.88,x,2.67,-1.29,timber,p,10).rotation.z=Math.PI/2;
   }
   for(let i=0;i<6;i++)cylinder(.038,.038,.65,(i-2.5)*.49,1.21,.79,pale,p,12).rotation.x=Math.PI/2;
  }else if(s.type==='lottery'){
   for(let i=0;i<12;i++){
    const x=(i%6-2.5)*.74,z=.58+Math.floor(i/6)*.48;
    box(.52,.06,.35,x,1.23,z,paper[i%paper.length],p);
    for(let line=0;line<3;line++)box(.35,.009,.02,x,1.266,z+(line-1)*.08,cream,p);
   }
   for(let i=0;i<6;i++){
    const x=(i-2.5)*.63;
    box(.44,.68,.04,x,1.65,-.28,paper[(i+1)%paper.length],p);
    for(let line=0;line<3;line++)box(.29,.028,.016,x,1.56+line*.12,-.25,cream,p);
   }
  }else if(s.type==='fortune'){
   const violet=mat(s.color);
   box(4.45,.039,.93,0,1.212,.87,violet,p);
   for(let i=0;i<8;i++){
    const tile=box(.24,.037,.36,(i-3.5)*.46,1.244,1.02,paper[(i+2)%paper.length],p);
    tile.rotation.y=(i%3-1)*.17;
   }
   cylinder(.21,.24,.5,-1.63,1.47,.6,red,p,14);
   for(let i=0;i<11;i++){
    const stick=box(.035,.47+(i%3)*.08,.024,-1.63+(i%4-1.5)*.082,1.79,.6+(Math.floor(i/4)-1)*.084,pale,p);
    stick.rotation.z=(i%4-1.5)*.13;
   }
   for(const x of [.88,1.35,1.82])cylinder(.13,.13,.031,x,1.255,.57,gold,p,14);
  }else if(s.type==='fruit'){
   for(let i=0;i<3;i++){
    const x=(i-1)*1.28;
    cylinder(.43,.34,.19,x,1.27,.8,woodLight,p,16);
    for(let j=0;j<8;j++){
     const angle=j*2.399;
     ball(.12,.104,.14,x+Math.cos(angle)*.26,1.42+(j%3)*.06,.8+Math.sin(angle)*.26,paper[(i+j)%4],p);
    }
   }
  }else if(s.type==='costumes'){
   for(let i=0;i<4;i++){
    const x=(i-1.5)*1.1,y=2.22;
    const color=colors[i];
    ball(.21,.215,.15,x,y+.21,-.77,color,p);
    box(.54,.48,.04,x,y-.21,-.76,color,p);
    for(const sign of [-1,1])box(.17,.39,.049,x+sign*.29,y-.21,-.75,color,p).rotation.z=sign*.29;
    box(.4,.067,.05,x,y-.27,-.73,gold,p);
   }
  }
 }
 for(const stall of MARKET_STALLS){
  const p=action(new T.Group(),stall.id);
  const side=Math.sign(stall.x);
  p.position.set(stall.x,.15,stall.z);p.rotation.y=-side*Math.PI/2;root.add(p);
  const stage=stall.type==='stage';
  box(6,.15,4.1,0,.06,0,stage?carpet:woodLight,p);
  for(const x of [-2.67,2.67])for(const z of [-1.78,1.78]){
   cylinder(.07,.085,3.03,x,1.52,z,timber,p,8);
   cylinder(.125,.135,.19,x,.12,z,wood,p,8);
  }
  for(const z of [-1.82,1.82])box(5.7,.13,.14,0,2.9,z,wood,p);
  const cloth=fabric(stall.color);
  roofPanel(cloth,p,1);roofPanel(cloth,p,-1);
  tube([[-3,3.73,0],[3,3.73,0]],.056,wood,p);
  for(let i=0;i<14;i++){
   const x=(i-6.5)*.417;
   box(.415,.18+(i%2)*.065,.045,x,2.79,2.19,i%4===0?gold:mat(stall.color),p);
  }
  box(3.55,.64,.065,0,2.63,2.225,wood,p);
  addSign(stall.sign,stall.color,3.41,.53,0,2.63,2.27,p);
  for(const x of [-2.57,2.57])lantern(x,2.2,2.04,.19,stage?red:warm,p);
  p.updateWorldMatrix(true,false);
  if(stage){
   box(5.25,2.13,.11,0,1.42,-1.73,mat('#813831'),p);
   addSign('ĐÊM HỘI HIÊN AN','#813831',4.48,.86,0,1.91,-1.66,p);
   for(const x of [-1.82,1.82]){
    cylinder(.41,.49,.58,x,.46,.1,red,p,18);
    cylinder(.42,.42,.046,x,.769,.1,pale,p,18);
    for(let i=0;i<8;i++)ball(.035,.034,.034,x+.36*Math.sin(i*Math.PI/4),.738,.1+.36*Math.cos(i*Math.PI/4),gold,p);
   }
  }else{
   box(4.93,.87,.94,0,.63,.85,wood,p);
   box(5.12,.13,1.11,0,1.13,.85,woodLight,p);
   for(let i=0;i<11;i++)box(.023,.7,.04,(i-5)*.425,.62,1.33,woodLight,p);
   stock(stall,p);
   const vendor=actor({profile:actors.length%8,palette:(actors.length+2)%8});
   actors.push({rig:vendor,x:stall.x+side*.78,z:stall.z,yaw:-side*Math.PI/2,phase:actors.length*1347});
  }
 }
 for(const z of FAIR_BUNTING_ROWS)pennants(z);
 for(const sign of [-1,1]){
  for(const z of [97.8,69.2]){
   cylinder(.17,.23,.43,sign*6.3,.24,z,wood,root,12);
   cylinder(.06,.075,3.66,sign*6.3,1.85,z,timber,root,10);
   lantern(sign*6.3,2.95,z,.39,red,root);
  }
 }
 for(const x of [-3.45,3.45])cylinder(.055,.08,5.02,x,2.56,110,timber,root,8);
 box(7.03,.11,.19,0,4.96,110,timber,root);
 addSign('PHỐ HỘI TAM QUAN','#713b2e',6.7,.87,0,4.44,110.12,root);
 addSign('PHỐ HỘI TAM QUAN','#713b2e',6.7,.87,0,4.44,109.88,root).rotation.y=Math.PI;
 for(const [i,cart] of MARKET_CARTS.entries()){
  const p=action(new T.Group(),cart.id),side=Math.sign(cart.x),accent=mat(cart.color);
  p.position.set(cart.x,.15,cart.z);root.add(p);
  box(1.14,.49,2,0,.67,0,accent,p);
  box(1.29,.12,2.16,0,.98,0,woodLight,p);
  for(const x of [-.66,.66]){
   cylinder(.44,.44,.093,x,.43,-.15,ink,p,22).rotation.z=Math.PI/2;
   cylinder(.326,.326,.103,x,.43,-.15,timber,p,22).rotation.z=Math.PI/2;
   for(let j=0;j<6;j++)box(.125,.7,.023,x*1.1,.43,-.15,gold,p).rotation.x=j*Math.PI/6;
   cylinder(.08,.08,.145,x,.43,-.15,wood,p,12).rotation.z=Math.PI/2;
   box(.065,.078,.96,x*.68,.91,-1.46,wood,p);
  }
  const sign=addSign(cart.sign,cart.color,1.84,.42,-side*.65,.78,0,p);
  sign.rotation.y=-side*Math.PI/2;
  const canopy=new T.ConeGeometry(1.42,.43,12,1,true);
  const canopyMesh=new T.Mesh(canopy,fabric(cart.color));
  canopyMesh.position.set(0,2.3,.17);p.add(canopyMesh);
  cylinder(.034,.047,1.53,0,1.64,.17,timber,p,8);
  for(let j=0;j<12;j++){
   const a=j*Math.PI/6;
   ball(.068,.088,.068,Math.sin(a)*1.39,2.065,.17+Math.cos(a)*1.39,paper[(i+j)%paper.length],p);
  }
  if(cart.type==='lottery'){
   for(let j=0;j<8;j++){
    const x=(j%2-.5)*.42,z=(Math.floor(j/2)-1.5)*.40;
    box(.33,.045,.28,x,1.07,z,paper[(i+j)%paper.length],p);
    box(.21,.009,.027,x,1.096,z+.04,cream,p);
   }
   for(let j=0;j<3;j++){
    const ticket=box(.025,.34,.26,side*.33,1.23,-.56+j*.47,paper[(j+2)%paper.length],p);
    ticket.rotation.z=side*.35;
   }
  }else if(cart.type==='tea'){
   for(let j=0;j<5;j++){
    const x=(j%2-.5)*.42,z=(Math.floor(j/2)-1)*.52;
    ball(.16,.21,.16,x,1.21,z,j%2?glaze:cream,p);
    cylinder(.1,.1,.052,x,1.425,z,gold,p,12);
   }
  }else if(cart.type==='fruit'){
   for(let j=0;j<11;j++){
    const x=Math.sin(j*2.4)*.38,z=(j%5-2)*.31;
    ball(.119,.105,.14,x,1.13+(j%2)*.095,z,paper[(i+j)%4],p);
   }
  }else if(cart.type==='toys'){
   for(let j=0;j<8;j++){
    const x=j%2*.45-.225,z=Math.floor(j/2)*.43-.66,y=1.35+(j%3)*.07;
    cylinder(.012,.012,y-1.02,x,(y+1.02)/2,z,wood,p,6);
    ball(.14,.1,.082,x,y,z,colors[j%4],p);
   }
  }else{
   for(let j=0;j<6;j++)box(.37,.14,.39,(j%2)*.44-.22,1.12,Math.floor(j/2)*.51-.64,leaf,p);
  }
  const vendor=actor({profile:(i+3)%8,palette:(i+5)%8});
  actors.push({rig:vendor,x:cart.x,z:cart.z-1.7,yaw:side*-.64,phase:1800+i*1370});
 }
 for(let i=0;i<16;i++){
  const stall=MARKET_STALLS[i%(MARKET_STALLS.length-1)];
  const [x,z]=stallFront(stall);
  const side=Math.sign(x);
  actors.push({rig:actor({profile:(i+3)%8,palette:(i+5)%8}),phase:i*3771,route:[
   [side*2.9,z-4.6],[side*4.3,z-1.85],[x,z-.75],[x,z+.85],[side*4.5,z+2.8],[side*2.9,z+4.2]
  ]});
 }
 for(const [i,id] of [5,4,6,7].entries()){
  const costume=COSTUMES.find(item=>item.id===id);
  const rig=actor(actorStyle(costume));
  rig.root.scale.setScalar([1.09,1.11,1.13,1.16][i]);
  parade.push(rig);
 }
 for(const [i,costume] of COSTUMES.filter(c=>c.collection!=='Tây Du Ký').entries()){
  const side=i%2?1:-1;
  actors.push({rig:actor(actorStyle(costume)),phase:i*4937,route:[
   [side*3.5,67],[side*4.45,76],[side*4.65,88],[side*3.8,95],[side*3.4,87],[side*3.25,74]
  ],performer:true});
 }
 const steamGeometry=new T.BufferGeometry(),steamData=new Float32Array(45);
 steamGeometry.setAttribute('position',new T.BufferAttribute(steamData,3));
 const vapor=new T.Points(steamGeometry,new T.PointsMaterial({color:'#e9dfc5',size:.11,transparent:true,opacity:.35,depthWrite:false}));
 vapor.frustumCulled=false;root.add(vapor);
 const activeBodies=[];
 let visibleActors=0,visibleParade=0,visibleLion=false;
 function place(rig,x,z,yaw,pose,now,dt,grid,otherBlocks){
  const body=rig.root.position,radius=body.radius??BODY_RADIUS;
  const blocked=(from,nx,nz)=>grid.blocks(from,nx,nz,body,radius)||otherBlocks(from,nx,nz,body,radius);
  const wasVisible=rig.root.visible;
  if(wasVisible)grid.remove(body);
  if(!wasVisible||blocked(body,body.x,body.z)){
   let free=null;
   for(const distance of [0,.45,.9,1.35,1.8]){
    for(let i=0;i<(distance?8:1);i++){
     const nx=x+distance*Math.sin(i*Math.PI/4),nz=z+distance*Math.cos(i*Math.PI/4),point={x:nx,z:nz};
     if(validPosition(nx,nz)&&!blocked(point,nx,nz)){free=point;break}
    }
    if(free)break;
   }
   if(!free){rig.root.visible=false;return false}
   body.set(free.x,groundHeight(free.x,free.z),free.z);rig.root.rotation.y=yaw;
  }else if(pose==='walk'){
   const step=steer(body,x,z,dt*2.2,(nx,nz)=>blocked(body,nx,nz));
   if(step){body.set(step.x,groundHeight(step.x,step.z),step.z);yaw=step.yaw}
   else pose='idle';
   const turn=Math.atan2(Math.sin(yaw-rig.root.rotation.y),Math.cos(yaw-rig.root.rotation.y));
   rig.root.rotation.y+=turn*Math.min(1,dt*9);
  }
  rig.root.visible=true;grid.add(body);activeBodies.push(body);
  rig.update(pose,now);return true;
 }
 function update(now,dt,camera,reduced,quality,count,grid,otherBlocks){
  const dist=Math.hypot(camera.position.x,camera.position.z-origin[1]);
  const motion=reduced?0:now;
  activeBodies.length=0;visibleActors=0;visibleParade=0;
  const nearLion=count>0&&Math.hypot(camera.position.x-LION_POINT.x,camera.position.z-LION_POINT.z)<42;
  if(lion.root.visible)grid.remove(lion.body);
  visibleLion=nearLion&&(lion.root.visible||!grid.blocks(lion.body,lion.body.x,lion.body.z));
  lion.update(now,visibleLion,reduced,(from,x,z)=>grid.blocks(from,x,z)||otherBlocks(from,x,z));
  if(visibleLion){grid.add(lion.body);activeBodies.push(lion.body)}
  function hide(rig){if(rig.root.visible)grid.remove(rig.root.position);rig.root.visible=false}
  for(const [i,rig] of parade.entries()){
   if(!count||dist>=59){hide(rig);continue}
   const {point,heading}=paradeSample(paradeDistance(now,reduced)-i*1.48);
   const offset=i%2?.48:-.44;
   if(place(rig,point.x+heading.z*offset,point.z-heading.x*offset,Math.atan2(heading.x,heading.z),reduced?'idle':'walk',motion+i*410,dt,grid,otherBlocks))visibleParade++;
  }
  const candidates=[];
  for(const a of actors){
   const t=motion+a.phase;
   let x=a.x,z=a.z,yaw=a.yaw,pose=t%6900<1200?'greet':'idle';
   if(a.route){
    const progress=(t/(a.performer?5300:3700))%a.route.length;
    const idx=Math.floor(progress),f=progress-idx,from=a.route[idx],to=a.route[(idx+1)%a.route.length];
    const step=a.performer?f:Math.min(1,f*1.43);
    x=T.MathUtils.lerp(from[0],to[0],step);z=T.MathUtils.lerp(from[1],to[1],step);
    yaw=Math.atan2(to[0]-from[0],to[1]-from[1]);pose=reduced||step===1?'idle':'walk';
   }
   const near=Math.hypot(camera.position.x-x,camera.position.z-z);
   if(!count||dist>=58||near>=(quality==='light'?29:40)){hide(a.rig);continue}
   candidates.push({a,x,z,yaw,pose,score:near-(a.route?0:3)-(a.rig.root.visible?2:0)});
  }
  candidates.sort((a,b)=>a.score-b.score);
  const budget=quality==='light'?16:quality==='high'?33:24;
  for(const [i,{a,x,z,yaw,pose}] of candidates.entries()){
   if(i>=budget){hide(a.rig);continue}
   if(place(a.rig,x,z,yaw,pose,motion+a.phase,dt,grid,otherBlocks))visibleActors++;
  }
  for(const flag of flags){
   const a=flag.geometry.attributes.position;
   for(let i=2;i<a.count;i+=3)a.setZ(i,Math.sin(motion*.003+i*.52)*.23);
   a.needsUpdate=true;
  }
  vapor.visible=dist<36&&!reduced;
  if(vapor.visible&&steam.length){
   const p=steam[0];
   for(let i=0;i<steamData.length/3;i++){
    const t=(motion*.0006+i/15)%1;
    steamData[i*3]=p.x+Math.sin(t*8+i)*t*.32;
    steamData[i*3+1]=p.y+t*1.16;
    steamData[i*3+2]=p.z+Math.cos(t*9+i)*t*.22;
   }
   steamGeometry.attributes.position.needsUpdate=true;
  }
 }
 return {update,paradeCamera,bodies:activeBodies,get visibleActors(){return visibleActors+visibleParade},get visibleParade(){return visibleParade},get visibleLion(){return visibleLion},dispose(){
  for(const rig of parade){root.remove(rig.root);rig.dispose()}
  for(const a of actors){root.remove(a.rig.root);a.rig.dispose()}
  textureMaps.forEach(map=>map.dispose());
 }};
}
