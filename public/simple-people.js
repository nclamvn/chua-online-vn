import * as T from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

export function createSimplePeople(scene,max){
 const parts=[];
 function part(g,scale,pos,kind,color){g=g.toNonIndexed();g.scale(...scale);g.translate(...pos);const n=g.attributes.position.count;g.setAttribute('color',new T.Float32BufferAttribute(Array.from({length:n},()=>new T.Color(color).toArray()).flat(),3));g.setAttribute('clothPart',new T.Float32BufferAttribute(new Float32Array(n).fill(['#ffffff','#d3c7af','#e5dbbf'].includes(color)?1:0),1));g.setAttribute('limbKind',new T.Float32BufferAttribute(new Float32Array(n).fill(kind),1));parts.push(g)}
 part(new T.CylinderGeometry(.19,.245,.68,10,3),[1,1,.72],[0,.99,0],0,'#ffffff');
 // Keep the neck attached to both the torso and head in every shader pose.
 part(new T.CylinderGeometry(.048,.066,.21,8),[1,1,1],[0,1.395,0],0,'#d2af91');
 part(new T.SphereGeometry(1,10,8),[.09,.13,.10],[0,1.59,0],0,'#d2af91');
 part(new T.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI*.48),[.093,.13,.101],[0,1.62,-.005],0,'#302d27');
 for(let i=0;i<2;i++){const s=i?-1:1;part(new T.CylinderGeometry(.073,.08,.62,7),[1,1,.8],[s*.115,.36,0],1+i,'#d3c7af');part(new T.SphereGeometry(1,8,6),[.071,.045,.14],[s*.115,.045,.05],1+i,'#38372e');part(new T.CylinderGeometry(.062,.054,.51,7),[1,1,1],[s*.25,1.04,0],3+i,'#e5dbbf');part(new T.SphereGeometry(1,8,6),[.033,.065,.025],[s*.25,.76,0],3+i,'#d2af91')}
 const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
 const params=new Float32Array(max*4),tints=new Float32Array(max*3);tints.fill(1);geometry.setAttribute('crowdTint',new T.InstancedBufferAttribute(tints,3));geometry.setAttribute('crowdParams',new T.InstancedBufferAttribute(params,4));
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1});const clock={value:0};
 material.onBeforeCompile=shader=>{shader.uniforms.crowdTime=clock;shader.vertexShader='attribute float limbKind; attribute float clothPart; attribute vec3 crowdTint; attribute vec4 crowdParams; uniform float crowdTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <color_vertex>','#include <color_vertex>\nvColor.rgb*=mix(vec3(1.),crowdTint,clothPart);');shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 float kind=limbKind; float pose=crowdParams.z; float swing=sin(crowdTime*5.4*crowdParams.x+crowdParams.y)*.32*step(.5,pose)*(1.-step(1.5,pose));
 if(kind>.5){float side=(mod(kind,2.)<.5)?-1.:1.; float pivot=kind<2.5?.7:1.28;float angle=swing*side*(kind>2.5?-1.:1.);if((pose>1.5&&pose<2.5||pose>3.5)&&kind>2.5)angle=-1.0;if(pose>2.5&&pose<3.5&&kind<2.5)angle=-1.2;float cy=transformed.y-pivot,cz=transformed.z;transformed.y=pivot+cy*cos(angle)-cz*sin(angle);transformed.z=cy*sin(angle)+cz*cos(angle);if(pose>1.5&&pose<2.5&&kind>2.5)transformed.x*=.35;}
 if(pose>2.5){if(kind<.5||kind>2.5)transformed.y-=.48;else transformed.y*=.45;}
 if(pose>3.5&&transformed.y>.48){float tilt=.52+.27*sin(crowdTime*1.9);float y=transformed.y-.48;transformed.z+=y*sin(tilt);transformed.y=.48+y*cos(tilt);}
 `)};
 const far=new T.InstancedMesh(geometry,material,max);far.userData.dynamic=true;far.castShadow=false;far.receiveShadow=true;far.frustumCulled=false;far.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(far);
 far.count=0;
 return {far,params,tints,clock,dispose(){
  scene.remove(far);
  geometry.dispose();
  material.dispose();
 }};
}
