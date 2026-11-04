import {buildStatueCourts} from './statue-courts.js?v=precinct-1';
import * as T from './vendor/three.module.js';
import {ZONES,SEATS,groundHeight,WORLD,FESTIVAL_COURT,LOTUS_POND} from './world-rules.js?v=pond-parking-1';
// Original precinct, built in metres. No scanned real temple is represented.
export function buildCampus({scene,box,cylinder,ball,tube,mesh,mat,wood,woodLight,stone,stoneLight,gold,warm,roof,walk,action,cushion,waterMat,lotus}){
 const plaster=mat('plaster','#d6d0ba',{roughness:.96}),red=mat('lacquer','#713c30'),metal=mat('brass-dark','#71613e',{metalness:.7,roughness:.4});
 const paving=stoneLight.clone();paving.color.set('#d0cebe');const loader=new T.TextureLoader();for(const [slot,file,srgb] of [['map','diffuse.jpg',true],['normalMap','normal-gl.jpg',false],['roughnessMap','roughness.jpg',false]]){const t=loader.load('/assets/r3/monastery_stone_floor/'+file,()=>paving.needsUpdate=true);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(24,18);t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;paving[slot]=t}
 // Overlapping paving sections need distinct heights above the grass at .10 m.
 function pave(width,depth,x,z,top,continuous=false){
  const thickness=.18;
  const slab=box(width,thickness,depth,x,top-thickness/2,z,paving);
  if(continuous){
   slab.geometry=slab.geometry.clone();
   const {position,normal,uv}=slab.geometry.attributes;
   for(let i=0;i<uv.count;i++)if(normal.getY(i)>.9)
    uv.setXY(i,(x+position.getX(i)*width)/82,(z+position.getZ(i)*depth)/62);
  }
  return walk(slab);
 }
 pave(FESTIVAL_COURT.width,FESTIVAL_COURT.depth,0,FESTIVAL_COURT.z,.115);
 pave(105,39,0,-40,.115);
 const sidePathX=LOTUS_POND.halfWidth+7;
 for(const x of [-sidePathX,sidePathX])pave(13,133,x,4,.125);
 for(const x of [-54,54]){
  pave(31,30,x,-12,.135);
  pave(32,29,x,45,.135);
 }
 pave(64,25,0,106.5,.125);
 // Long cloisters frame the large site without forcing the player through a corridor.
 for(const sign of [-1,1])for(const z of [-61,-29,3,35,67,99]){
 const g=new T.Group();g.position.set(sign*104,0,z);scene.add(g);box(8,.35,27,0,.175,0,stone,g);
 for(const x of [-3,3])for(const zz of [-11,-5,1,7,12]){cylinder(.13,.18,3.6,x,2.05,zz,wood,g);box(.14,.23,26,x,3.7,0,woodLight,g)}roof(10,29,5.5,g);
 }
 function plaque(text,x,y,z,w,parent){const cv=document.createElement('canvas');cv.width=1024;cv.height=192;const cx=cv.getContext('2d');cx.fillStyle='#243f35';cx.fillRect(0,0,1024,192);cx.strokeStyle='#b79c64';cx.lineWidth=3;cx.strokeRect(12,12,1000,168);cx.fillStyle='#e3d1a4';cx.font='62px Georgia';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(text,512,102);const map=new T.CanvasTexture(cv);map.colorSpace=T.SRGBColorSpace;return box(w,.8,.12,x,y,z,new T.MeshStandardMaterial({map,roughness:.8}),parent)}
 function pavilion(zone,w=22,d=17){const pos=ZONES[zone],x=pos.point[0],z=pos.point[1]-9;const g=new T.Group();g.position.set(x,0,z);scene.add(g);box(w+2,.4,d+2,0,.2,0,stone,g);box(w,.18,d,0,.56,0,stoneLight,g);
 for(const sign of [-1,1])box(.35,3.9,d,sign*w/2,2.6,0,plaster,g);box(w,3.9,.32,0,2.6,-d/2,plaster,g);
 for(let xx=-w/2+1;xx<=w/2-1;xx+=4){cylinder(.18,.24,4.8,xx,3, d/2-.5,wood,g);box(.35,.3,d-.5,xx,5.2,0,woodLight,g)}box(w,.38,.4,0,5.3,d/2-.5,wood,g);roof(w+3,d+4,7.7,g);
 for(let i=0;i<3;i++)walk(box(9,.15,1.1,0,.1+i*.15,d/2+2-i*.9,stone,g));
 for(const sign of [-1,1])for(let zz=-d/2+2;zz<d/2-1;zz+=1.3){box(.4,1.6,.09,sign*(w/2-.22),3.3,zz,woodLight,g);box(.12,1.6,.09,sign*(w/2-.32),3.3,zz,wood,g)}
 plaque(pos.name,0,4.6,d/2-.15,7.2,g);const desk=box(w-4,.85,1.6,0,1.1,-2.5,woodLight,g);action(desk,pos.action,[x,groundHeight(x,z),z+2]);
 for(const xx of [-w/2+2,w/2-2]){cylinder(.25,.23,.8,xx,3.8,d/2-.5,warm,g);cylinder(.29,.29,.06,xx,4.23,d/2-.5,metal,g)}
 return {g,x,z,desk};}
 const oracle=pavilion('oracle');
 for(const xx of [-6,-3,3,6]){box(2.4,2.1,.65,xx,1.6,-7.7,wood,oracle.g);for(let row=0;row<5;row++)for(let col=0;col<3;col++){box(.72,.34,.06,xx-.78+col*.78,.8+row*.4,-7.3,woodLight,oracle.g);ball(.025,.025,.025,xx-.78+col*.78,.8+row*.4,-7.24,gold,oracle.g)}}
 for(const xx of [-4,0,4]){const pot=cylinder(.22,.23,.52,xx,1.76,-2.5,red,oracle.g,24);action(pot,'oracle',[oracle.x+xx,.65,oracle.z]);for(let i=0;i<17;i++){const a=i*2.4;const stick=box(.018,.8,.045,xx+Math.sin(a)*.14,2.1+Math.sin(i)*.05,-2.5+Math.cos(a)*.14,woodLight,oracle.g);stick.rotation.z=Math.sin(i)*.12}}
 const offerings=pavilion('offerings');
 for(let i=0;i<5;i++){const x=-7+i*3.5;cylinder(.8,.8,.09,x,1.57,-2.5,gold,offerings.g,24);for(let j=0;j<5;j++){const a=j/5*Math.PI*2;ball(.13,.15,.13,x+Math.sin(a)*.3,1.72,-2.5+Math.cos(a)*.3,mat('fruit','#9c6c3e'),offerings.g)}cylinder(.035,.035,.55,x,1.92,-2.5,warm,offerings.g)}
 for(const sign of [-1,1]){box(3,1.8,.55,sign*7,1.4,-7.5,wood,offerings.g);for(let i=0;i<4;i++)box(.65,.75,.1,sign*7-1+i*.67,1.6,-7.17,red,offerings.g)}
 // Tea terrace, real-sized tables and seating along an open water garden.
 const tea=new T.Group();tea.position.set(-53,0,43);scene.add(tea);box(23,.3,19,0,.15,0,stoneLight,tea);for(const x of [-9,9])for(const z of [-7,7])cylinder(.16,.22,4.2,x,2.4,z,wood,tea);roof(27,23,7,tea);plaque('Hiên trà',0,4.4,8.3,6,tea);
 for(const x of [-6,0,6]){cylinder(.95,.95,.12,x,.86,0,woodLight,tea,32);cylinder(.1,.25,.75,x,.43,0,wood,tea);for(const z of [-1.6,1.6]){box(2.3,.12,.65,x,.45,z,woodLight,tea);for(const dx of [-.85,.85])box(.09,.45,.09,x+dx,.22,z,wood,tea)}cylinder(.09,.1,.12,x,.99,0,plaster,tea,16);for(const dx of [-.35,.35])cylinder(.055,.06,.08,x+dx,.99,.2,plaster,tea,12)}
 action(tea,'tea',[-53,.15,47]);for(const seat of SEATS.filter(s=>s.id.startsWith('tea:')))cushion(seat.x,seat.z);
 // Garden meditation:24actual reservable seats, a broad reflecting basin and bamboo.
 walk(box(27,.14,24,53,.08,44,stoneLight));for(const seat of SEATS.filter(s=>s.id.startsWith('zen:')))cushion(seat.x,seat.z);
 for(const x of [38,68])for(const z of [31,58]){cylinder(.14,.17,3.6,x,1.8,z,wood);box(.5,.1,.5,x,3.65,z,warm)}
 const gong=cylinder(1.1,1.1,.12,53,3.4,30,gold,scene,48);gong.rotation.x=Math.PI/2;action(gong,'gathering',[53,.15,34]);for(const x of [51.4,54.6])box(.16,4.4,.16,x,2.2,30,wood);tube([[51.2,4.3,30],[53,4.6,30],[54.8,4.3,30]],.12,wood);
 // Memorial hall and a tall pagoda define the horizon of the entire precinct.
 const memorial=new T.Group();memorial.position.set(0,0,-70);scene.add(memorial);box(31,.45,25,0,.225,0,stone,memorial);box(29,.2,23,0,.56,0,stoneLight,memorial);for(const x of [-13,13])for(const z of [-10,0,10])cylinder(.23,.3,5.7,x,3.5,z,wood,memorial);roof(35,29,9.3,memorial);plaque('Hiên tưởng niệm',0,5.3,10.9,9,memorial);
 for(let i=0;i<36;i++){const x=-12+(i%12)*2.2,z=-8+Math.floor(i/12)*3.2;box(.45,.8,.14,x,1.25,z,wood,memorial);cylinder(.06,.07,.24,x,1.8,z,warm,memorial,10)}
 action(memorial,'memorial',[0,.65,-61]);
 const tower=new T.Group();tower.position.set(0,0,-84);scene.add(tower);cylinder(5.6,6.6,1.1,0,.55,0,stone,tower,8);
 for(let level=0;level<7;level++){const y=1.1+level*2.5,r=4.9-level*.44;cylinder(r,r+.1,1.65,0,y+.8,0,plaster,tower,8);for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const col=cylinder(.08,.11,1.6,Math.sin(a)*r,y+.85,Math.cos(a)*r,red,tower);col.castShadow=false}cylinder(r+1.05,r+.25,.9,0,y+2.03,0,woodLight,tower,8);cylinder(r+.15,r+1.1,.15,0,y+2.5,0,red,tower,8)}cylinder(.03,.3,3,0,20,0,gold,tower,16);
 // Two quiet ponds, surrounded by a broad continuous walking network.
 for(const x of [-53,53]){box(30,.25,20,x,-.28,-51,stone);const basin=mesh(new T.PlaneGeometry(29,19),waterMat);basin.rotation.x=-Math.PI/2;basin.position.set(x,-.03,-51);basin.castShadow=false;for(let i=0;i<15;i++)lotus(x+(Math.sin(i*2.4)*12),-51+Math.cos(i*1.8)*8,.55);for(const z of [-61,-41])box(31,.32,.35,x,.05,z,stoneLight)}
 // Outer gateway and lantern avenues make the enlarged garden legible from above.
 const outer=new T.Group();outer.position.z=ZONES.gate.point[1]+6;outer.scale.set(1.3,1.22,1.15);scene.add(outer);for(const x of [-11,-4,4,11]){box(.75,6.2,.75,x,3.1,0,stone,outer);box(.95,.2,.95,x,6.2,0,stoneLight,outer)}box(24,.65,1.4,0,5.9,0,stone,outer);roof(26,5.6,9,outer);plaque('Hiên An',0,5.8,.85,6.4,outer);action(outer,'map',[0,.15,ZONES.gate.point[1]]);
 const flagGeo=new T.PlaneGeometry(.8,1.9),flagColors=['#344b79','#c5a24b','#9e4a3d','#e2dfce','#bf7850'];
 for(let side=-1;side<=1;side+=2)for(let z=38;z<96;z+=7){const x=side*61;cylinder(.035,.06,4.8,x,2.4,z,metal);const f=mesh(flagGeo,mat('flag-'+z%5,flagColors[Math.floor(z/7)%5],{side:T.DoubleSide}));f.position.set(x+.45,3.6,z);f.castShadow=false;cylinder(.2,.2,.65,side*31,3.6,z,warm);cylinder(.035,.055,3.3,side*31,1.65,z,wood)}
 for(let side=-1;side<=1;side+=2){const pts=[];for(let i=0;i<25;i++){const x=-55+i*110/24,z=side<0?37:88;pts.push([x,5.2-Math.sin(i/24*Math.PI)*1.1,z]);if(i%2===0)cylinder(.2,.2,.5,x,4.7-Math.sin(i/24*Math.PI)*1.1,z,warm)}tube(pts,.018,metal)}
 // New garden trees are placed outside circulation and can use shared far geometry.
 const statueCount=buildStatueCourts({scene,box,cylinder,tube,mesh,mat,wood,woodLight,stone,stoneLight,warm,roof,walk,pave,plaque});
 const forestSites=Array.from({length:90},(_,i)=>{
  const side=i%4,t=Math.floor(i/4)/23;
  const x=T.MathUtils.lerp(WORLD.minX,WORLD.maxX,t);
  const z=T.MathUtils.lerp(WORLD.minZ,WORLD.maxZ,t);
  if(side===0)return [x,WORLD.minZ-10,3];
  if(side===1)return [WORLD.minX-8,z,3];
  if(side===2)return [WORLD.maxX+8,z,3];
  return [x,WORLD.maxZ+8,3];
 });
 return {statueCount,treeSites:[[-64,-74,2.8],[64,-74,3.2],[-79,86,3],[79,86,3.3],[-69,22,2.5],[69,20,2.6],[-45,-132,3.1],[27,-134,2.7],[-67,-119,3],[74,-124,3.1],[-41,-174,2.8],[41,-174,3.2]],forestSites};
}
