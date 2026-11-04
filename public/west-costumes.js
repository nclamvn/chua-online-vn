import * as T from './vendor/three.module.js';

const gold='#e0af51', cream='#ead4a6', leather='#65351f', red='#9b3128';
const materialCache=new Map(), geometries=new Map();
let brocade, threads;

function fabric(color){
 if(!brocade){
  const loader=new T.TextureLoader();
  brocade=loader.load('/assets/fair/jacquard-diff.webp');
  threads=loader.load('/assets/fair/jacquard-nor_gl.webp');
  brocade.colorSpace=T.SRGBColorSpace;
  for(const map of [brocade,threads]){map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(2,2)}
 }
 if(!materialCache.has(color))materialCache.set(color,new T.MeshStandardMaterial({
  color,map:brocade,normalMap:threads,normalScale:new T.Vector2(.35,.35),roughness:.77,side:T.DoubleSide
 }));
 return materialCache.get(color);
}

// Patterned cloth follows the chest/pelvis bones. The open front gives each leg room to move.
function drape(parent,color,top,bottom,width,depth,open=false){
 const key=[top,bottom,width,depth,open].join();
 if(!geometries.has(key)){
  const g=new T.PlaneGeometry(1,1,30,12),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
   const u=p.getX(i)+.5,v=.5-p.getY(i);
   const a=u*Math.PI*2;
   const fold=Math.sin(a*9+.4)*(.008+v*.016);
   const gap=open?.25+v*.14:.035;
   const angle=gap+a*(1-gap/Math.PI);
   p.setXYZ(i,Math.sin(angle)*(width*(.73+.36*v)+fold),T.MathUtils.lerp(top,bottom,v)+Math.cos(a*2)*.021*v,Math.cos(angle)*(depth*(.88+.31*v)+fold));
  }
  g.computeVertexNormals();geometries.set(key,g);
 }
 const m=new T.Mesh(geometries.get(key),fabric(color));parent.add(m);return m;
}
function cord(parent,color,points,radius){
 if(!materialCache.has(color))materialCache.set(color,new T.MeshStandardMaterial({color,roughness:.64}));
 const key=JSON.stringify([points,radius]);
 if(!geometries.has(key)){
  const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
  geometries.set(key,new T.TubeGeometry(path,16,radius,5,false));
 }
 parent.add(new T.Mesh(geometries.get(key),materialCache.get(color)));
}
function blade(parent,color,points,thickness){
 const key=JSON.stringify([points,thickness]);
 if(!geometries.has(key)){
  const s=new T.Shape();
  s.moveTo(...points[0]);points.slice(1).forEach(p=>s.lineTo(...p));s.closePath();
  geometries.set(key,new T.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:true,bevelSegments:1,bevelThickness:.004,bevelSize:.004}));
 }
 if(!materialCache.has(color))materialCache.set(color,new T.MeshStandardMaterial({color,metalness:.4,roughness:.45}));
 const m=new T.Mesh(geometries.get(key),materialCache.get(color));m.position.z=.058;parent.add(m);return m;
}

export function buildWestCostume({style,head,chest,hip,right,part,staff}){
 const jewel='#8d302d';
 if(style==='pilgrim'){
  drape(chest,'#b23d32',.16,-.33,.28,.183,true);
  drape(hip,'#a83a32',.07,-.49,.30,.23,true);
  drape(hip,'#c89656',.07,-.43,.225,.173);
  part(hip,'disc','#e4ac51',0,.061,.005,.199,.066,.146);
  for(const sign of [-1,1]){
   cord(chest,gold,[[sign*.15,.16,.10],[sign*.12,.044,.174],[sign*.052,-.108,.182]],.012);
   cord(chest,cream,[[sign*.13,.17,.104],[sign*.088,.04,.175],[0,-.054,.183]],.011);
  }
  for(let i=0;i<9;i++){
   const a=Math.PI*(i/4-.96);
   part(hip,'oval',gold,Math.sin(a)*.228,-.362,Math.cos(a)*.217,.015,.039,.012);
  }
  part(head,'disc',red,0,.174,0,.123,.066,.115);
  part(head,'ring',gold,0,.152,.005,.124,.102,.11).rotation.x=Math.PI/2;
  for(let i=-2;i<=2;i++){
   const x=i*.046,y=.214+(.04-Math.abs(i)*.011);
   const petal=part(head,'oval',gold,x,y,.087,.033,.063,.02);petal.rotation.z=-i*.19;
   part(head,'oval',jewel,x,y+.011,.102,.022,.043,.012).rotation.z=-i*.19;
   part(head,'oval',gold,x,y+.065,.093,.009,.009,.009);
  }
  for(const s of [-1,1])cord(head,gold,[[s*.106,.195,.06],[s*.12,.04,.045],[s*.104,-.11,.013]],.008);
  staff(right,'#5c3c26',gold);
  part(right,'ring',gold,0,.56,.045,.083,.107,.08);
  for(const s of [-1,1]){
   part(right,'ring',gold,s*.064,.46,.045,.034,.052,.03);
   part(right,'ring',gold,s*.045,.554,.058,.03,.034,.028);
  }
 }else if(style==='monkey'){
  const fur='#7d461f',lightFur='#aa6831',face='#c7875b';
  part(head,'oval',fur,0,.083,-.018,.123,.148,.124);
  part(head,'oval',face,0,.043,.095,.089,.103,.051);
  part(head,'oval','#c18c63',0,-.014,.126,.061,.045,.044);
  part(head,'oval','#693829',0,.025,.158,.026,.017,.014);
  cord(head,'#542f22',[[-.036,-.029,.157],[0,-.037,.17],[.036,-.029,.157]],.004);
  for(const s of [-1,1]){
   part(head,'oval',lightFur,s*.105,.049,.005,.038,.054,.032);
   part(head,'oval',face,s*.118,.057,.026,.016,.029,.016);
   part(head,'oval','#ddc3a1',s*.037,.075,.134,.027,.023,.012);
   part(head,'oval','#231915',s*.036,.074,.146,.010,.014,.008);
   part(head,'oval','#633419',s*.038,.098,.13,.039,.012,.019).rotation.z=s*.22;
   for(let i=0;i<4;i++){
    part(head,'oval',i%2?lightFur:fur,s*(.084+i*.006),.04-i*.013,.092-i*.011,.02,.042,.015).rotation.z=s*(.48+i*.1);
   }
   cord(head,red,[[s*.065,.201,.004],[s*.121,.326,-.035],[s*.197,.36,-.109],[s*.246,.284,-.159]],.009);
   cord(head,gold,[[s*.062,.201,.015],[s*.114,.29,-.017],[s*.153,.324,-.065]],.006);
   const guard=part(chest,'oval',gold,s*.176,.116,.039,.108,.057,.12);
   guard.rotation.z=s*.2;
   part(chest,'oval',leather,s*.174,.093,.099,.075,.044,.077);
  }
  part(head,'disc',gold,0,.155,-.009,.125,.034,.12);
  cord(head,gold,[[-.078,.153,.09],[-.038,.177,.112],[0,.155,.124],[.038,.177,.112],[.078,.153,.09]],.01);
  drape(chest,'#93602f',.11,-.28,.221,.186);
  drape(hip,'#9f3c26',.04,-.30,.242,.173,true);
  part(chest,'oval',gold,0,.022,.168,.067,.071,.024);
  part(chest,'oval',jewel,0,.022,.19,.03,.032,.012);
  for(let row=0;row<3;row++)for(let i=0;i<5;i++){
   part(chest,'oval','#d19849',(i-2)*.051,-.066-row*.048,.166-Math.abs(i-2)*.012,.027,.026,.008);
  }
  staff(right,'#8b3125',gold);
  for(const y of [-.97,-.93,.28,.32])part(right,'disc','#8d5c26',0,y,.045,.034,.012,.034);
 }else if(style==='boar'){
  const skin='#be8375';
  drape(chest,'#323745',.13,-.35,.28,.203,true);
  drape(hip,'#333a4c',.087,-.37,.29,.23,true);
  part(hip,'oval','#bb8a6c',0,.14,.15,.195,.201,.151);
  part(hip,'disc','#755439',0,.01,.02,.25,.065,.205);
  part(head,'oval',skin,0,.05,.01,.143,.131,.132);
  for(const s of [-1,1]){
   part(head,'oval',skin,s*.128,.094,-.013,.056,.091,.036).rotation.z=s*-.44;
   part(head,'oval','#d29987',s*.151,.108,.013,.034,.061,.022).rotation.z=s*-.44;
   part(head,'oval','#ead1b2',s*.050,.081,.112,.024,.018,.016);
   part(head,'oval','#372b24',s*.049,.082,.127,.009,.012,.005);
   part(head,'oval','#704437',s*.048,.108,.106,.037,.013,.02).rotation.z=s*.26;
   part(head,'oval','#a26058',s*.028,.019,.182,.013,.014,.008);
  }
  part(head,'oval','#d79687',0,.012,.142,.081,.048,.054);
  for(const s of [-1,1])part(head,'oval','#6c423b',s*.026,.021,.191,.013,.011,.006);
  cord(head,'#663e32',[[-.067,-.031,.121],[0,-.044,.15],[.067,-.031,.121]],.006);
  part(head,'dome','#292735',0,.131,-.009,.145,.077,.13);
  part(head,'disc','#665035',0,.142,.009,.145,.018,.126);
  staff(right,'#6c4630','#b0ada0');
  part(right,'bar','#afb2a8',0,.49,.06,.33,.041,.036);
  for(let i=-4;i<=4;i++){
   cord(right,'#b1b0a0',[[i*.038,.49,.065],[i*.038,.54,.091],[i*.038,.538,.134]],.012);
  }
 }else{
  drape(chest,'#31736c',.15,-.34,.28,.19,true);
  drape(hip,'#31594e',.087,-.46,.30,.218,true);
  drape(hip,'#756346',.09,-.33,.24,.17);
  part(hip,'disc','#7a4d30',0,.05,.02,.221,.055,.169);
  part(head,'disc','#79573b',0,.153,-.009,.123,.043,.12);
  part(head,'oval','#bf843f',0,.159,.106,.037,.029,.012);
  for(let i=-3;i<=3;i++){
   const x=i*.022,y=-.058+Math.abs(i)*.012;
   part(head,'oval',i%2?'#633723':'#483127',x,y,.102,.028,.083-Math.abs(i)*.009,.031).rotation.z=-i*.13;
  }
  for(let i=-5;i<=5;i++){
   const x=i*.038,y=-.148+Math.abs(i*.034);
   part(chest,'oval',i%2?'#63442c':'#895c38',x,y,.184-Math.abs(i)*.005,.026,.032,.025);
  }
  staff(right,'#684629','#a5a99d');
  blade(right,'#b5bcb1',[[-.16,.60],[-.13,.49],[-.065,.44],[.069,.44],[.134,.49],[.162,.60],[.093,.542],[.04,.525],[-.04,.525],[-.093,.542]],.023);
 }
}
