import * as T from './vendor/three.module.js';
import {HALL_CHESTS,HALL_DECK,HALL_FISHES,HALL_MONKS} from './hall-layout.js?v=hall-200';

export function buildHallFurnishings({scene,box,cylinder,ball,tube,mesh,mat,wood,woodLight,stone,gold,dark,action}){
 const floor=HALL_DECK.height;
 const lacquer=mat('hall-lacquer','#743929',{roughness:.42});
 const canvas=document.createElement('canvas');canvas.width=480;canvas.height=128;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#42281c';ctx.fillRect(0,0,480,128);
 ctx.strokeStyle='#c8a870';ctx.lineWidth=4;ctx.strokeRect(12,12,456,104);
 ctx.fillStyle='#e8d4a8';ctx.font='bold 51px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('CÔNG ĐỨC',240,66);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const inscription=mat('hall-chest-inscription','#ffffff',{map});
 for(const {x,z,width,depth} of HALL_CHESTS){
  const chest=new T.Group();chest.position.set(x,floor,z);scene.add(chest);
  box(width,.92,depth,0,.63,0,lacquer,chest);
  box(width+.12,.15,depth+.10,0,1.14,0,wood,chest);
  box(width+.10,.17,depth+.10,0,.18,0,woodLight,chest);
  box(.54,.008,.067,0,1.219,0,dark,chest);
  box(1.04,.29,.035,0,.74,depth/2+.012,inscription,chest);
  for(const side of [-1,1])box(.055,.8,.045,side*.69,.66,depth/2+.018,gold,chest);
  action(chest,'alms',[x,floor,z+1.4]);
 }

 const fish=HALL_FISHES.map(({x,z,scale})=>{
  const group=new T.Group();group.position.set(x,floor,z);group.scale.setScalar(scale);scene.add(group);
  box(1.86,.18,1.24,0,.09,0,stone,group);
  box(1.65,.18,1.13,0,.23,0,woodLight,group);
  const head=new T.Group();head.position.y=.57;head.userData.dynamic=true;group.add(head);
  ball(.69,.31,.46,0,0,0,lacquer,head);
  ball(.25,.27,.34,.53,.035,.035,lacquer,head);
  tube([[-.52,.03,.34],[-.19,.017,.442],[.29,.016,.45],[.62,.055,.302]],.035,dark,head);
  for(const side of [-1,1]){
   ball(.057,.049,.031,.53,.115,side*.306,gold,head);
   for(let i=0;i<3;i++)tube([[.23-i*.18,.255,.17*side],[.18-i*.18,.21,.28*side],[.14-i*.18,.117,.407*side]],.017,woodLight,head);
  }
  const handle=box(.066,.07,.89,.49,.38,.27,wood,group);handle.rotation.y=.36;
  ball(.12,.125,.12,.32,.38,-.13,woodLight,group);
  action(group,'wood',[x,floor,z+1.8]);
  return head;
 });

 const saffron=mat('hall-robe-saffron','#c98539'),umber=mat('hall-robe-umber','#985232');
 const skin=mat('hall-monk-skin','#ad7855'),fold=mat('hall-robe-hem','#e0a457');
 for(const {x,z,seated} of HALL_MONKS){
  const monk=new T.Group();monk.position.set(x,floor,z);monk.rotation.y=x>0?-.24:.24;scene.add(monk);
  const headY=seated?1.10:1.67,shoulder=headY-.26,cloth=x>0?saffron:umber;
  const profile=seated?[[.33,.04],[.39,.18],[.26,.42],[.19,.57],[.205,.77],[.095,.96]]:
   [[.27,.045],[.30,.18],[.24,.52],[.18,.93],[.19,1.27],[.20,1.43],[.09,1.52]];
  const robe=new T.LatheGeometry(profile.map(point=>new T.Vector2(...point)),24);
  const pos=robe.attributes.position;
  for(let i=0;i<pos.count;i++){
   const px=pos.getX(i),y=pos.getY(i),pz=pos.getZ(i);
   const pleat=1+.052*Math.sin(9*Math.atan2(pz,px)+y*5);
   pos.setXYZ(i,px*pleat,y,pz*pleat*.75);
  }
  robe.computeVertexNormals();mesh(robe,cloth,monk);
  if(seated)for(const side of [-1,1])ball(.25,.13,.20,side*.20,.17,.12,cloth,monk);
  cylinder(.061,.078,.15,0,headY-.13,0,skin,monk,12);
  ball(.116,.155,.112,0,headY,0,skin,monk);
  ball(.024,.033,.03,0,headY-.025,.106,skin,monk);
  for(const side of [-1,1]){
   ball(.025,.043,.022,side*.11,headY-.018,0,skin,monk);
   const arm=ball(.081,.193,.088,side*.178,shoulder-.15,.04,cloth,monk);
   arm.rotation.z=side*.36;arm.rotation.x=-.40;
   ball(.048,.066,.035,side*.052,shoulder-.26,.225,skin,monk).rotation.z=side*.33;
  }
  tube([[-.15,shoulder+.04,.035],[-.09,shoulder-.08,.145],[.043,shoulder-.24,.158],[.16,shoulder-.40,.10]],.019,fold,monk);
 }
 return fish;
}
