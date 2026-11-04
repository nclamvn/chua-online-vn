import {PARKING_DRIVE} from './parking-layout.js';

export function parkingRoute(car,entering,start=PARKING_DRIVE.start){
 const {z:lane,radius}=PARKING_DRIVE;
 const {x,z,side}=car;
 const arcLength=radius*Math.PI/2;
 const stallYaw=side<0?0:Math.PI;
 const turnX=x+(entering?-radius:radius);
 const turnZ=lane+side*radius;
 const roadLength=start-turnX;
 const bayLength=Math.abs(z-turnZ);
 const length=roadLength+arcLength+bayLength;
 function pose(distance){
  const along=entering?distance:length-distance;
  if(along<=roadLength)return {x:start-along,z:lane,yaw:entering?-Math.PI/2:Math.PI/2};
  const angle=(along-roadLength)/radius;
  if(angle<Math.PI/2){
   if(entering)return {x:turnX+radius*Math.sin(angle),z:turnZ-side*radius*Math.cos(angle),yaw:-Math.PI/2-side*angle};
   return {x:turnX-radius*Math.sin(angle),z:turnZ-side*radius*Math.cos(angle),yaw:stallYaw+side*(angle-Math.PI/2)};
  }
  return {x,z:turnZ+side*(along-roadLength-arcLength),yaw:stallYaw};
 }
 return {length,pose,reverse:distance=>entering&&distance>roadLength,speed:distance=>entering?(distance<roadLength-.7?5.7:1.9):(distance<bayLength+arcLength?2.6:6.3)};
}

// Intersect a walking segment with the car footprint expanded by body radius.
export function crossesCar(car,pose,from,x,z,padding){
 const sin=Math.sin(pose.yaw),cos=Math.cos(pose.yaw);
 const dx=from.x-pose.x,dz=from.z-pose.z,stepX=x-from.x,stepZ=z-from.z;
 let near=0,far=1;
 for(const [start,step,half] of [
  [dx*cos-dz*sin,stepX*cos-stepZ*sin,car.width/2+.13+padding],
  [dx*sin+dz*cos,stepX*sin+stepZ*cos,car.length/2+.06+padding],
 ]){
  if(Math.abs(step)<1e-8){
   if(Math.abs(start)>half)return false;
   continue;
  }
  const a=(-half-start)/step,b=(half-start)/step;
  near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
  if(near>far)return false;
 }
 return true;
}
