import {createVisitor} from './avatar.js?v=pond-parking-1';
import {BODY_RADIUS,steer} from './body-collision.js?v=hoi-rong-1';
import {clearSegment,findPath} from './pathfinding.js?v=hoi-rong-1';
import {groundHeight,validPosition} from './world-rules.js?v=hoi-rong-1';
import {ARRIVING_CARS,PARKING_DRIVE,PARKING_LOT} from './parking-layout.js';
import {crossesCar,parkingRoute} from './parking-motion.js';

const GATEWAY=[{x:76,z:52},{x:69,z:57},{x:58,z:63},{x:41,z:58},{x:38,z:35},{x:39,z:12},{x:26,z:10},{x:0,z:8},{x:0,z:-6.4}];
const bounds=({x,z})=>x>64&&x<156&&z>36&&z<68;
const closeToCar=(pose,point,padding)=>Math.abs(point.x-pose.x)<padding&&Math.abs(point.z-pose.z)<padding;

export function createParkingTraffic({scene,host,models,bodies,crowd}){
 const visitors=[];
 const templePath=GATEWAY.slice(1).flatMap((point,i)=>findPath(GATEWAY[i],point)??[]);
 let current=null,next=0,started=false,idle=1,parkings=0,departures=0,arrivals=0,yields=0;

 function blocks(from,x,z){
  const pose=current?.pose;
  if(!pose||(!bounds(from)&&!bounds({x,z}))||!closeToCar(pose,from,5)&&!closeToCar(pose,{x,z},5))return false;
  return crossesCar(current.car,pose,from,x,z,BODY_RADIUS+.04+(current.door??0)*.30);
 }

 function personInWay(car,pose,padding=.19){
  const radius=Math.hypot(car.width/2,car.length/2)+1;
  const inside=person=>crossesCar(car,pose,person,person.x,person.z,(person.radius??BODY_RADIUS)+padding);
  return bodies.someNear(pose.x,pose.z,radius,inside)||crowd.someNear(pose.x,pose.z,radius,inside);
 }

 function letPassengerOut(car){
  const start={x:car.x-car.side*.86,z:car.z-car.side*(car.length/2+.62)};
  if(!validPosition(start.x,start.z)||bodies.blocks(start,start.x,start.z)||crowd.blocks(start,start.x,start.z))return false;
  const path=findPath(start,GATEWAY[0]);
  if(!path)return false;
  let passenger=visitors.find(p=>!p.active);
  if(!passenger){
   if(visitors.length>=4)return false;
   const index=visitors.length;
   const rig=createVisitor({npc:true,name:'',appearance:{profile:(index*3+1)%8,palette:(index*2+2)%8},castShadow:false});
   scene.add(rig.root);
   passenger={rig,body:rig.root.position};
   visitors.push(passenger);
  }
  passenger.active=true;
  passenger.path=[...path,...templePath];
  passenger.finish=0;
  passenger.body.set(start.x,groundHeight(start.x,start.z),start.z);
  passenger.rig.root.rotation.y=car.side<0?0:Math.PI;
  passenger.rig.root.visible=true;
  bodies.add(passenger.body);
  return true;
 }

 function updatePeople(now,dt){
  for(const passenger of visitors){
   if(!passenger.active)continue;
   const {body,path,rig}=passenger;
   const target=path[0];
   if(!target){
    if(!passenger.finish){
     passenger.finish=now+6500;
     arrivals++;
    }
    if(now>=passenger.finish){
     bodies.remove(body);passenger.active=false;rig.root.visible=false;
    }else rig.update('idle',now);
    continue;
   }
   const step=steer(body,target.x,target.z,dt*2.45,(x,z)=>
    !clearSegment(body,{x,z})||blocks(body,x,z)||bodies.blocks(body,x,z)||crowd.blocks(body,x,z));
   if(step){
    bodies.move(body,step.x,step.z);
    body.y=groundHeight(step.x,step.z);
    const turn=step.yaw-rig.root.rotation.y;
    rig.root.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*10);
   }
   if(Math.hypot(body.x-target.x,body.z-target.z)<.035)path.shift();
   rig.update(step?'walk':'idle',now);
  }
 }

 function begin(){
  const car=ARRIVING_CARS[next],model=models[next];
  const route=parkingRoute(car,true,started?PARKING_DRIVE.start:PARKING_DRIVE.firstStart);
  const pose=route.pose(0);
  if(personInWay(car,pose))return;
  model.setPose(pose);
  current={car,model,route,pose,distance:0,stage:'entering',waiting:false};
  next=(next+1)%ARRIVING_CARS.length;
  started=true;
 }

 function updateCar(dt){
  if(!current){
   idle-=dt;
   if(idle<=0)begin();
   return;
  }
  const car=current;
  if(car.stage==='parked'){
   car.pause+=dt;
   if(!car.unloaded&&car.pause>1.1)car.unloaded=letPassengerOut(car.car);
   const open=Math.max(0,Math.min(1,(car.pause-.28)/.68,(3-car.pause)/.66));
   car.door=open&&!personInWay(car.car,car.pose,.30)?open:0;
   car.model.setDoor(car.door);
   if(car.pause<7||!car.unloaded)return;
   car.route=parkingRoute(car.car,false);
   car.stage='leaving';car.distance=0;
   return;
  }
  const distance=Math.min(car.route.length,car.distance+dt*car.route.speed(car.distance));
  const pose=car.route.pose(distance);
  const midway=car.route.pose((distance+car.distance)/2);
  const waiting=personInWay(car.car,pose)||personInWay(car.car,midway);
  if(waiting&&!car.waiting)yields++;
  car.waiting=waiting;
  if(waiting)return;
  const spin=(distance-car.distance)*(car.route.reverse(distance)?-1:1);
  car.model.setPose(pose,spin);
  car.pose=pose;car.distance=distance;
  if(distance<car.route.length)return;
  if(car.stage==='entering'){
   car.stage='parked';car.pause=0;car.unloaded=false;parkings++;
  }else{
   car.model.setPose(null);
   current=null;idle=2;departures++;
  }
 }

 function update(now,dt,camera,reduced){
  if(!reduced){
   updatePeople(now,dt);
   const localNear=Math.hypot(camera.position.x-PARKING_LOT.x,camera.position.z-PARKING_LOT.z)<64;
   if(localNear||current)updateCar(dt);
  }
 }

 function report(){
  host.dataset.traffic=JSON.stringify({
   stage:current?.stage??'idle',waiting:current?.waiting??false,
   car:current&&{x:current.pose.x,z:current.pose.z,yaw:current.pose.yaw},
   passengers:visitors.filter(p=>p.active).map(({body})=>({x:body.x,z:body.z})),
   parkings,departures,arrivals,yields,
  });
 }
 return {update,report,blocks,passengerBodies:()=>visitors.filter(p=>p.active).map(p=>p.body),dispose(){for(const {rig} of visitors){scene.remove(rig.root);rig.dispose()}}};
}
