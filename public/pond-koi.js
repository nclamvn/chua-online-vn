import * as T from './vendor/three.module.js';

const COUNT=26;
const PALETTES=[
 ['#ede3c4','#ed501b','#2c3935'],
 ['#f28529','#f6bb53','#cb4722'],
 ['#eee2c9','#bb3218','#d9541c'],
 ['#dfb959','#f7d783','#654037'],
];

export function buildPondKoi(scene,pond){
 const group=new T.Group();
 scene.add(group);
 const form=new T.SphereGeometry(1,18,14);
 form.scale(.205,.155,.60);
 const school=PALETTES.map(([base,patch,accent],pattern)=>{
  const geometry=form.clone(),positions=geometry.attributes.position,colors=[];
  const tones=[base,patch,accent].map(hex=>new T.Color(hex));
  for(let i=0;i<positions.count;i++){
   const x=positions.getX(i)/.205,y=positions.getY(i)/.155,z=positions.getZ(i)/.6;
   const markings=Math.sin(z*9.4+x*2.8+pattern)+Math.cos(x*3.7+y*3.2-z*4.5);
   tones[markings>.51?1:markings<-1.6?2:0].toArray(colors,i*3);
  }
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const bodies=new T.InstancedMesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.58}),Math.ceil(COUNT/PALETTES.length));
  bodies.count=Math.floor((COUNT+PALETTES.length-1-pattern)/PALETTES.length);
  bodies.frustumCulled=false;
  bodies.instanceMatrix.setUsage(T.DynamicDrawUsage);
  group.add(bodies);
  return bodies;
 });
 form.dispose();

 // The forked tail is hinged behind the body. Side fins share one instance set.
 const tailShape=new T.Shape();
 tailShape.moveTo(0,0);tailShape.quadraticCurveTo(.055,-.23,.19,-.42);
 tailShape.quadraticCurveTo(.073,-.41,0,-.32);
 tailShape.quadraticCurveTo(-.073,-.41,-.19,-.42);tailShape.quadraticCurveTo(-.055,-.23,0,0);
 const tailGeometry=new T.ShapeGeometry(tailShape);
 tailGeometry.rotateX(Math.PI/2);
 const finsGeometry=new T.SphereGeometry(1,10,6);
 finsGeometry.scale(.205,.026,.09);
 const material=new T.MeshStandardMaterial({side:T.DoubleSide,roughness:.64});
 const tails=new T.InstancedMesh(tailGeometry,material,COUNT);
 const fins=new T.InstancedMesh(finsGeometry,material,COUNT*2);
 for(const part of [tails,fins]){
  part.frustumCulled=false;
  part.instanceMatrix.setUsage(T.DynamicDrawUsage);
  group.add(part);
 }
 const color=new T.Color();
 for(let i=0;i<COUNT;i++){
  color.set(PALETTES[i%PALETTES.length][1]);
  tails.setColorAt(i,color);
  fins.setColorAt(i*2,color);
  fins.setColorAt(i*2+1,color);
 }

 const pose=new T.Object3D(),partPose=new T.Object3D(),matrix=new T.Matrix4();
 const meshes=[...school,tails,fins];
 let lastTime;
 const centerZ=(pond.northBank+pond.southBank)/2;
 const centerX=(pond.halfWidth+pond.bridgeHalfWidth)/2;
 const roomX=(pond.halfWidth-pond.bridgeHalfWidth)/2;
 function update(time){
  if(time===lastTime)return;
  lastTime=time;
  for(let i=0;i<COUNT;i++){
   const side=Math.floor(i/3)%2?1:-1;
   const phase=i*2.399;
   const speed=.096+(i%6)*.019;
   const a=time*speed+phase;
   const width=roomX*(.48+(i%5)*.107);
   const depth=2.2+(i%4)*1.15;
   const drift=side*(i%3-1)*1.15;
   const wobble=Math.sin(time*4.6+phase);
   const size=.72+(i%7)*.075;
   pose.position.set(side*centerX+Math.cos(a)*width+drift,-.29-(i%5)*.082+Math.sin(a*1.6)*.055,centerZ+Math.sin(a)*depth);
   pose.rotation.y=Math.atan2(-Math.sin(a)*width,Math.cos(a)*depth)+wobble*.055;
   pose.scale.setScalar(size);pose.updateMatrix();
   school[i%PALETTES.length].setMatrixAt(Math.floor(i/PALETTES.length),pose.matrix);
   partPose.position.set(0,.02,-.48);partPose.rotation.set(0,wobble*.38,0);partPose.updateMatrix();
   tails.setMatrixAt(i,matrix.multiplyMatrices(pose.matrix,partPose.matrix));
   for(const sign of [-1,1]){
    partPose.position.set(sign*.19,-.045,.10);partPose.rotation.set(0,sign*(.57+wobble*.14),sign*.25);partPose.updateMatrix();
    fins.setMatrixAt(i*2+(sign+1)/2,matrix.multiplyMatrices(pose.matrix,partPose.matrix));
   }
  }
  for(const part of meshes)part.instanceMatrix.needsUpdate=true;
 }
 update(0);
 return {count:COUNT,update};
}
