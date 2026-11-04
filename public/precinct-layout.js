// Shared by the 3D scene and server-side movement validation. Front is +Z.
export const ARHATS=[-1,1].flatMap(side=>Array.from({length:18},(_,i)=>({
 x:side*89,z:-53-i*5.9,side,variant:i
})));
export const GALLERY={x:89,centres:[-77,-131],halfWidth:5.6,halfDepth:26.5};
export const GALLERY_POSTS=[-1,1].flatMap(side=>GALLERY.centres.flatMap(z=>
 [-4.5,4.5].flatMap(dx=>[-25,-15,-5,5,15,25].map(dz=>[side*GALLERY.x+dx,z+dz]))));
export const COMPASSION={x:52,z:-116,radius:5.2};
export const TAM_THE={z:-168,width:36,depth:20,floor:1.32,stepsFront:-153};
export const REAR_PLANTERS=[[-60,-110],[-37,-110],[-61,-137],[-34,-137],[31,-109],[70,-109],[31,-128],[69,-128]];
export const REAR_LAMPS=[-1,1].flatMap(side=>[-103,-125,-144,-153].map(z=>[side*10.5,z]));
export const TAM_THE_POSTS=[-15,-9,-3,3,9,15].map(x=>[x,TAM_THE.z+8.8]);

export function rearHallHeight(x,z){
 const {z:center,width,depth,floor,stepsFront}=TAM_THE,front=center+depth/2;
 if(Math.abs(x)<=width/2&&z>=center-depth/2&&z<=front)return floor;
 if(Math.abs(x)<7&&z>front&&z<stepsFront)return .15+(stepsFront-z)/(stepsFront-front)*(floor-.15);
 return null;
}
