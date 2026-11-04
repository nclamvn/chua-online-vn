import {arrivalPoints,destinationPoints,createBodyGrid,steer} from './body-collision.js?v=hoi-rong-1';
import {buildFair} from './fair-scene.js?v=hoi-rong-1';
import {LION_POINT,MARKET_CARTS,MARKET_STALLS,stallFront} from './fair-catalog.js?v=hoi-rong-1';
import * as T from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {HDRLoader} from './vendor/HDRLoader.js';
import {MeshoptDecoder} from './assets/r3/meshopt_decoder.module.js';
import {CLOTH_PALETTE,createVisitor,labelSprite} from './avatar.js?v=pond-parking-1';
import {createSimplePeople} from './simple-people.js?v=surface-1';
import {CAPACITY,SEATS,ZONES,nearestZone,validPosition,groundHeight,GREETING_WINDOW_MS,GREETING_LIMIT,HALL,HALL_DECK,BELL_PAVILION,LOTUS_POND,lotusBridgeRise} from './world-rules.js?v=hoi-rong-1';
import {clearSegment,findPath} from './pathfinding.js?v=hoi-rong-1';
import {buildParking} from './parking-scene.js?v=traffic-1';
import {createParkingTraffic} from './parking-traffic.js';
import {buildPondKoi} from './pond-koi.js';
import {buildCampus} from './campus.js?v=pond-parking-1';
import {createCrowd} from './crowd.js?v=hoi-rong-1';
import {HALL_ALTAR,HALL_INCENSE,HALL_FISHES,HALL_GARDEN_SEATS,HALL_SEATS,onHallDeck} from './hall-layout.js?v=hall-200';
import {buildHallFurnishings} from './hall-furnishings.js?v=hall-200';
import {Sky} from './vendor/Sky.js';
import {buildMountainBackdrop} from './landscape.js?v=precinct-1';

// Original procedural environment. Dimensions are in scene metres.
export function createTemple({host,onAction,onStatus,onWalk,onSeat,onContext,onHallView,onReady,markers}) {
  const renderer = new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setSize(host.clientWidth,host.clientHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  renderer.domElement.setAttribute('aria-label','Sân chùa 3D. Chạm để đi, kéo để xoay, cuộn hoặc chụm hai ngón để thu phóng.');
  renderer.domElement.setAttribute('role','img');
  host.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color('#d9dfcb');scene.fog=new T.Fog('#afc3c4',225,850);const skyDome=new Sky();skyDome.scale.setScalar(10000);skyDome.frustumCulled=false;skyDome.material.uniforms.turbidity.value=3;skyDome.material.uniforms.rayleigh.value=1.5;skyDome.material.uniforms.mieCoefficient.value=.004;skyDome.material.uniforms.cloudCoverage.value=.35;skyDome.material.uniforms.cloudDensity.value=.3;skyDome.material.uniforms.sunPosition.value.set(-.45,.5,.45);scene.add(skyDome);
  host.dataset.mountainLayers=String(buildMountainBackdrop(scene));
  const camera=new T.PerspectiveCamera(55,host.clientWidth/host.clientHeight,.5,1500);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.085;controls.enablePan=false;
  controls.minDistance=6;controls.maxDistance=440;controls.minPolarAngle=.24;controls.maxPolarAngle=1.55;
  controls.zoomSpeed=.7;controls.rotateSpeed=.6;
  const isPortrait=()=>camera.aspect<.8;
  function facadeShot(){
    const narrow=camera.aspect<1.1;
    // Set the eye line below the front beam and just past the lotus pond gate.
    const position=narrow?[2,7.35,31.5]:[3,7.35,31.5];
    const target=narrow?[0,6.1,-10]:[-.5,6.1,-10];
    const halfWidth=narrow?1.47:1.7;
    const fov=T.MathUtils.radToDeg(2*Math.atan(halfWidth/Math.max(camera.aspect,.4)));
    return {position,target,fov};
  }
  const initialFacade=facadeShot();
  camera.fov=initialFacade.fov;
  camera.updateProjectionMatrix();
  camera.position.set(...initialFacade.position);
  controls.target.set(...initialFacade.target);
  controls.update();
  const hemi=new T.HemisphereLight('#ffedcd','#53634a',.65);scene.add(hemi);
  const sun=new T.DirectionalLight('#fff1dd',2.4);sun.position.set(-24,38,22);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-42,right:42,top:44,bottom:-38,near:1,far:110});
  sun.shadow.mapSize.set(1024,1024);sun.shadow.bias=-.0006;sun.shadow.normalBias=.045;scene.add(sun);scene.add(sun.target);
  const materials={},geometries={};
  const mat=(name,color,extra={})=>materials[name]||(materials[name]=new T.MeshStandardMaterial({color,roughness:.86,...extra}));
  const wood=mat('wood','#553a2a'),woodLight=mat('wood-light','#7f5337'),roofMat=mat('roof','#b26745'),stone=mat('stone','#beb69b'),stoneLight=mat('stone-light','#dbd1b6'),dark=mat('dark','#282c22'),gold=mat('gold','#b5954c',{metalness:.58,roughness:.42}),leafMat=mat('leaf','#5b7950'),leafLight=mat('leaf-light','#7d9453');
  const warm=mat('warm','#ffe0a0',{emissive:'#e6a448',emissiveIntensity:.8,roughness:.6});
  const boxGeo=new T.BoxGeometry(1,1,1),ballGeo=new T.SphereGeometry(1,24,16);
  function mesh(geo,material,parent=scene){const m=new T.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
  function box(w,h,d,x,y,z,material,parent=scene){const m=mesh(boxGeo,material,parent);m.scale.set(w,h,d);m.position.set(x,y,z);return m}
  function cylinder(rt,rb,h,x,y,z,material,parent=scene,segments=12){const key=`c${rt},${rb},${h},${segments}`;const g=geometries[key]||(geometries[key]=new T.CylinderGeometry(rt,rb,h,segments));const m=mesh(g,material,parent);m.position.set(x,y,z);return m}
  function ball(rx,ry,rz,x,y,z,material,parent=scene){const m=mesh(ballGeo,material,parent);m.scale.set(rx,ry,rz);m.position.set(x,y,z);return m}
  function tube(points,r,material,parent=scene){const m=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(8,points.length*5),r,6,false),material,parent);return m}
  const pickables=[],walkables=[],cushions=[],glowing=[],pondLanterns=[];
  function action(object,type,target){object.userData.action=type;if(target)object.userData.target=target;pickables.push(object);return object}
  function walk(object){object.userData.walkable=true;walkables.push(object);return object}
  function seeded(seed){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}const random=seeded(20261104);
  function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
    if(kind==='brick'){x.fillStyle='#988a6e';x.fillRect(0,0,512,512);for(let row=0;row<16;row++){for(let col=-1;col<9;col++){x.fillStyle=`hsl(${17+random()*5} 37% ${48+random()*10}%)`;x.fillRect(col*64+(row%2)*32+1,row*32+1,62,30)}}}
    else if(kind==='roof'){x.fillStyle='#6b3e2e';x.fillRect(0,0,512,512);for(let j=0;j<16;j++)for(let i=0;i<20;i++){x.fillStyle=`hsl(${15+random()*7} 42% ${33+random()*16}%)`;x.beginPath();x.roundRect(i*26,j*32,24,31,[2,2,10,10]);x.fill();x.strokeStyle='#d29b6050';x.beginPath();x.moveTo(i*26+4,j*32+4);x.lineTo(i*26+4,j*32+25);x.stroke()}}
    else {x.fillStyle='#857d62';x.fillRect(0,0,512,512);for(let i=0;i<15000;i++){x.fillStyle=random()>.5?'#bac49b30':'#414c3330';const a=random()*512,b=random()*512;x.fillRect(a,b,1+random()*4,1+random()*3)}}
    for(let i=0;i<5000;i++){x.fillStyle=random()>.5?'#fff1':'#0001';x.fillRect(random()*512,random()*512,1,1)}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;return tex}
  const textureLoader=new T.TextureLoader();
  function pbr(material,folder,repeat=[1,1],color='#ffffff'){
    material.color.set(color);
    for(const [slot,file,srgb] of [['map','diffuse.jpg',true],['normalMap','normal-gl.jpg',false],['roughnessMap','roughness.jpg',false]]){
      const t=textureLoader.load((folder.startsWith('/')?folder:'/assets/r3/'+folder)+'/'+file,()=>{material.needsUpdate=true});t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=renderer.capabilities.getMaxAnisotropy();if(srgb)t.colorSpace=T.SRGBColorSpace;material[slot]=t;
    }material.normalScale.set(.5,.5);material.roughness=1;
  }
  new HDRLoader().load('/assets/r3/monks_forest_1k.hdr',hdr=>{hdr.mapping=T.EquirectangularReflectionMapping;const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(hdr).texture;scene.environmentIntensity=.65;scene.backgroundBlurriness=.035;scene.backgroundRotation.y=.7;setTime(timeOfDay);pmrem.dispose();host.dataset.hdri='ready'},undefined,e=>console.warn('HDRI unavailable',e));
  pbr(wood,'dark_wood',[1,3]);pbr(woodLight,'weathered_planks',[1,2]);pbr(stone,'monastery_stone_floor',[1,1]);pbr(stoneLight,'monastery_stone_floor',[1,1]);
  const groundTex=texture('earth');groundTex.repeat.set(12,12);
  const ground=mat('ground','#8b9476',{map:groundTex,transparent:true});
  ground.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      #ifdef USE_FOG
        diffuseColor.a*=1.-smoothstep(470.,920.,vFogDepth);
      #endif
      #include <opaque_fragment>
    `);
  };
  const terrainRadius=1500;
  pbr(ground,'/assets/r4/vegetation/grass',[1350,1350]);
  const pondWidth=LOTUS_POND.halfWidth*2;
  const pondDepth=LOTUS_POND.southBank-LOTUS_POND.northBank;
  const pondCenter=(LOTUS_POND.northBank+LOTUS_POND.southBank)/2;
  const groundShape=new T.Shape();
  groundShape.moveTo(-terrainRadius,-terrainRadius);
  groundShape.lineTo(terrainRadius,-terrainRadius);
  groundShape.lineTo(terrainRadius,terrainRadius);
  groundShape.lineTo(-terrainRadius,terrainRadius);
  groundShape.closePath();
  for(const [x,z,w,d] of [[0,pondCenter,pondWidth,pondDepth],[-53,-51,30,20],[53,-51,30,20]]){
    const hole=new T.Path();
    hole.moveTo(x-w/2,-z-d/2);hole.lineTo(x-w/2,-z+d/2);
    hole.lineTo(x+w/2,-z+d/2);hole.lineTo(x+w/2,-z-d/2);
    hole.closePath();groundShape.holes.push(hole);
  }
  const floorGeometry=new T.ShapeGeometry(groundShape);
  const floorUV=floorGeometry.attributes.uv;
  for(let i=0;i<floorUV.count;i++){
    floorUV.setXY(i,.5+floorUV.getX(i)/(2*terrainRadius),.5+floorUV.getY(i)/(2*terrainRadius));
  }
  const landscape=walk(mesh(floorGeometry,ground));
  landscape.rotation.x=-Math.PI/2;
  landscape.position.y=.1;
  const brickTex=texture('brick');brickTex.repeat.set(4,3);
  const brick=mat('brick','#e4b895',{map:brickTex,bumpMap:brickTex,bumpScale:.045});
  pbr(brick,'square_brick_paving',[10,7]);brick.bumpMap=null;
  // Keep brick above the grass plane and adjoining paved paths.
  const brickTop=.145;
  function brickWalk(w,d,x,z,thickness){
    return walk(box(w,thickness,d,x,brickTop-thickness/2,z,brick));
  }
  brickWalk(65,39,0,-5.5,.24);
  // Stone curb and gardens define the courtyard.
  for(const x of [-32.7,32.7])box(.5,.42,39,x,.06,-5.5,stone);
  for(const x of [-34.5,34.5]){
    box(2.8,.4,40,x,-.04,-5.5,mat('garden','#67764b'));
    for(let i=0;i<18;i++){const z=-23+i*2;ball(.65,.5,.7,x,.2,z,random()>.5?leafMat:leafLight)}
  }
  for(const x of [-8.3,8.3])walk(box(.24,.025,11,x,brickTop+.0125,8.05,stoneLight));
  pbr(roofMat,'clay_roof_tiles_02',[7,4]);
  function roof(w,d,y,parent,detail=true){
    const nx=32,nz=20,positions=[],uv=[],indices=[];
    const height=(x,z)=>y-2.1*Math.abs(z)/(d/2)+.52*Math.pow(Math.abs(z)/(d/2),5)+.38*Math.pow(Math.abs(x)/(w/2),8);
    for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=(i/nx-.5)*w,z=(j/nz-.5)*d;positions.push(x,height(x,z),z);uv.push(i/nx,j/nz)}
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,e=c+1;indices.push(a,c,b,b,c,e)}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();mesh(g,roofMat,parent);const underside=wood.clone();underside.side=T.DoubleSide;mesh(g.clone().translate(0,-.13,0),underside,parent);
    if(!detail){cylinder(.12,.12,w,0,y+.06,0,woodLight,parent).rotation.z=Math.PI/2;return}
    // Individual clay barrel tiles add real relief and cast narrow contact shadows.
    const tileGeometry=new T.CylinderGeometry(.07,.083,.48,8,1,true,0,Math.PI);tileGeometry.rotateY(Math.PI/2);tileGeometry.rotateX(Math.PI/2);
    const cols=Math.floor(w/.23),rows=Math.floor(d/.44),tiles=new T.InstancedMesh(tileGeometry,roofMat,cols*rows),tile=new T.Object3D();let ti=0;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=(col+.5)/cols*w-w/2,z=(row+.5)/rows*d-d/2,slope=(height(x,z+.025)-height(x,z-.025))/.05;tile.position.set(x,height(x,z)+.038,z);tile.rotation.set(-Math.atan(slope),0,0);tile.updateMatrix();tiles.setMatrixAt(ti++,tile.matrix)}tiles.castShadow=true;tiles.receiveShadow=true;parent.add(tiles);
    for(let x=-w/2+.4;x<w/2;x+=.7){const pts=[];for(let j=0;j<=12;j++){const z=(j/12-.5)*d;pts.push([x,height(x,z)-.12,z])}tube(pts,.055,wood,parent)}

    for(const z of [-d/2,d/2]){const pts=[];for(let i=0;i<=16;i++){const x=(i/16-.5)*w;pts.push([x,height(x,z)-.08,z])}tube(pts,.045,woodLight,parent)}
    for(const x of [-w/2,w/2]){const pts=[];for(let i=0;i<=16;i++){const z=(i/16-.5)*d;pts.push([x,height(x,z),z])}tube(pts,.045,woodLight,parent)}
    cylinder(.11,.11,w,0,y+.07,0,woodLight,parent).rotation.z=Math.PI/2;
    for(const sign of [-1,1]){tube([[sign*w*.38,y+.1,0],[sign*w*.48,y+.3,0],[sign*w*.53,y+.85,0]],.04,woodLight,parent);for(const z of [-d/2,d/2])tube([[sign*w*.43,height(w*.43,z),z],[sign*w*.51,height(w*.5,z)+.3,z*1.02],[sign*w*.54,height(w*.5,z)+.8,z*1.02]],.035,woodLight,parent)}
  }
  function hangingLantern(x,y,z,parent){const g=new T.Group();g.position.set(x,y,z);parent.add(g);cylinder(.28,.27,.66,0,0,0,warm,g,12);cylinder(.31,.31,.07,0,.35,0,wood,g);cylinder(.26,.26,.07,0,-.35,0,wood,g);tube([[0,.4,0],[0,.9,0]],.025,wood,g);tube([[0,-.4,0],[0,-.72,0]],.025,gold,g);glowing.push(g);return g}
  // Main hall: broad timber bays, three roof tiers and a stone approach.
  const hall=new T.Group();
  hall.position.z=HALL.centerZ;
  hall.scale.set(HALL.scaleX,HALL.scaleY,HALL.scaleZ);
  scene.add(hall);
  // These pieces form the removable foreground of the hall overview.
  const hallCover=new T.Group(),hallCoverBatches=new T.Group();
  hall.add(hallCover);
  scene.add(hallCoverBatches);
  const deckDepth=HALL_DECK.front-HALL_DECK.back,deckCenter=(HALL_DECK.front+HALL_DECK.back)/2;
  const deckWidth=2*HALL_DECK.halfWidth;
  box(deckWidth+.36,.52,deckDepth+.22,0,.26,deckCenter,stone);
  box(deckWidth,.88,deckDepth,0,.96,deckCenter,stoneLight);
  const hallFloor=mat('hall-floor','#ffffff');
  pbr(hallFloor,'weathered_planks',[18,13]);
  walk(box(deckWidth,.18,deckDepth,0,HALL_DECK.height-.09,deckCenter,hallFloor));
  const aisle=hallFloor.clone();aisle.color.set('#aa906b');
  walk(box(2.24,.018,27.8,0,HALL_DECK.height+.011,-16.4,aisle));
  for(const side of [-1,1]){
    const x=side*(HALL.stairHalfWidth+HALL_DECK.halfWidth)/2;
    const width=HALL_DECK.halfWidth-HALL.stairHalfWidth;
    box(width,.25,.45,x,HALL_DECK.height+.78,HALL_DECK.front,stoneLight);
    for(let i=0;i<5;i++)box(.23,.67,.25,x+(i-2)*width/5,HALL_DECK.height+.34,HALL_DECK.front,stone);
  }
  const stepDepth=(HALL.stairFront-HALL_DECK.front)/6;
  for(let step=0;step<6;step++){
    const z=HALL.stairFront-(step+.5)*stepDepth;
    const top=.15+(HALL_DECK.height-.15)*(step+1)/6;
    walk(box(HALL.stairHalfWidth*2,top,stepDepth,0,top/2,z,step%2?stoneLight:stone));
  }
  for(const side of [-1,1]){
    const railX=side*(HALL.stairHalfWidth+.36);
    const railPoints=[];
    for(let i=0;i<=3;i++){
      const z=HALL.stairFront-(HALL.stairFront-HALL_DECK.front)*i/3;
      const y=.15+(HALL_DECK.height-.15)*i/3;
      box(.58,.85,.58,railX,y+.42,z,stone);
      ball(.29,.17,.29,railX,y+.89,z,stoneLight);
      railPoints.push([railX,y+.72,z]);
    }
    tube(railPoints,.18,stoneLight);
  }
  for(const z of [-4.7,4.7]){
    const facade=z>0?hallCover:hall;
    for(const x of [-8,-4,0,4,8]){
      if(x===0&&z>0)continue;
      cylinder(.4,.45,.35,x,1.13,z,stone,facade);cylinder(.22,.31,4.8,x,3.6,z,wood,facade);
      cylinder(.4,.35,.25,x,5.95,z,woodLight,facade);box(.22,.18,1.25,x,5.72,z,woodLight,facade);
    }
    box(18,.42,.4,0,6.15,z,wood,facade);box(18,.24,.34,0,5.62,z,woodLight,facade);
    for(let i=-8;i<=8;i+=.75)box(.09,.4,.1,i,5.9,z,woodLight,facade);
  }
  box(18,4.1,.25,0,3,-5.4,wood,hall);
  for(const x of [-8.9,8.9]){box(.25,3.5,10.45,x,2.65,-.175,wood,hall);for(let z=-4;z<=3;z+=.5)box(.3,1.2,.045,x,4.8,z,woodLight,hall)}
  const panelMat=mat('panel','#92734c');for(const x of [-6,-3,3,6]){box(2.2,3,.12,x,3.5,-5.2,panelMat,hall);for(let y=2.2;y<4.9;y+=.4)box(2,.045,.03,x,y,-5.1,wood,hall)}
  roof(23,15,8,hallCover);box(13,1.7,4.6,0,8,0,wood,hallCover);for(let x=-6;x<=6;x+=.5)box(.065,1.25,.07,x,8,2.35,woodLight,hallCover);for(const y of [7.4,8.6])box(13,.08,.08,0,y,2.35,woodLight,hallCover);roof(17,9,10.8,hallCover);
  box(8,1.3,3.65,0,11.02,0,wood,hallCover);
  for(let x=-3.5;x<=3.5;x+=.5)box(.09,1.08,.08,x,11.1,1.85,woodLight,hallCover);
  roof(11,6.4,12.9,hallCover);
  for(const x of [-8,-4,4,8]){
    box(.43,.36,1.7,x,6.06,4.76,woodLight,hallCover);
    box(.25,.16,2,x,6.26,4.76,gold,hallCover);
  }
  // Eave plaque intentionally has no invented scripture or attribution.
  const plaqueCanvas=document.createElement('canvas');plaqueCanvas.width=512;plaqueCanvas.height=128;const plaqueCtx=plaqueCanvas.getContext('2d');plaqueCtx.fillStyle='#344b39';plaqueCtx.fillRect(0,0,512,128);plaqueCtx.strokeStyle='#c8af79';plaqueCtx.lineWidth=3;plaqueCtx.strokeRect(8,8,496,112);plaqueCtx.fillStyle='#dfcc96';plaqueCtx.font='52px Georgia';plaqueCtx.textAlign='center';plaqueCtx.textBaseline='middle';plaqueCtx.fillText('HIÊN AN',256,68);const plaqueTexture=new T.CanvasTexture(plaqueCanvas);plaqueTexture.colorSpace=T.SRGBColorSpace;box(4.2,.72,.15,0,6.3,4.95,mat('plaque','#ffffff',{map:plaqueTexture}),hallCover);
  for(const x of [-6,6])for(const z of [-2.2,1.4,4.45])hangingLantern(x,4.55,z,hallCover);
  const {x:altarX,z:altarZ,width:altarWidth,depth:altarDepth}=HALL_ALTAR;
  box(altarWidth,.72,altarDepth,altarX,HALL_DECK.height+.36,altarZ,woodLight);
  box(18.6,.42,4.9,altarX,HALL_DECK.height+.93,altarZ,gold);
  for(const x of [-6,-4,4,6]){
    cylinder(.11,.25,.48,x,HALL_DECK.height+1.34,altarZ+1.6,gold,scene);
    cylinder(.07,.07,.27,x,HALL_DECK.height+1.71,altarZ+1.6,warm,scene);
  }
  const statue=new T.Group();statue.userData.dynamic=true;statue.position.set(altarX,HALL_DECK.height+1.14,altarZ-.25);scene.add(statue);
  const statueLoader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  statueLoader.load('/assets/r4/statue.glb',gltf=>{
    const sculpture=gltf.scene;sculpture.scale.setScalar(7.35);
    sculpture.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});
    statue.add(sculpture);
    for(const x of [-6.7,6.7]){
      const companion=sculpture.clone(true);
      companion.scale.setScalar(3.3);
      companion.position.set(x,.17,-.25);
      statue.add(companion);
      box(3.15,.17,2.4,x,HALL_DECK.height+1.225,altarZ-.50,gold,statue.parent);
    }
    host.dataset.statue='ready';
  },undefined,e=>console.warn('Museum statue unavailable',e));
  const altarLight=new T.SpotLight('#ffe5bf',240,21,.62,.78,2);
  altarLight.position.set(altarX-2.6,9.5,altarZ+7);
  altarLight.target.position.set(altarX,5.8,altarZ);
  scene.add(altarLight,altarLight.target);
  function incenseBowl(x,y,z,parent){const g=new T.Group();g.position.set(x,y,z);parent.add(g);cylinder(.5,.33,.42,0,0,0,gold,g,20);for(const a of [-1,1])tube([[a*.45,0,0],[a*.7,.1,0],[a*.65,.3,0]],.05,gold,g);for(let i=-1;i<=1;i++)cylinder(.012,.012,.8,i*.12,.58,0,mat('incense-stick','#774536'),g,5);return g}
  const incense=incenseBowl(HALL_INCENSE.x,HALL_DECK.height+.47,HALL_INCENSE.z,scene);
  action(incense,'incense',[HALL_INCENSE.x,HALL_DECK.height,HALL_INCENSE.z+1.25]);
  const smokeGeo=new T.BufferGeometry(),smokePos=new Float32Array(24*3);
  for(let i=0;i<24;i++){smokePos[i*3]=HALL_INCENSE.x;smokePos[i*3+1]=HALL_DECK.height+1.02;smokePos[i*3+2]=HALL_INCENSE.z}
  smokeGeo.setAttribute('position',new T.BufferAttribute(smokePos,3));
  const smoke=new T.Points(smokeGeo,new T.PointsMaterial({color:'#e5dcc8',size:.15,transparent:true,opacity:0,depthWrite:false}));scene.add(smoke);let incenseUntil=0;
  // Sittable cushions are genuine picking targets, no virtual occupied seats.
  const cushionMat=mat('cushion','#7c7563');pbr(cushionMat,'rough_linen',[2,2],'#8e8267');cushionMat.map=null;
  function cushion(x,z,y=groundHeight(x,z)+.11){const c=cylinder(.65,.7,.22,x,y,z,cushionMat);action(c,'seat',[x,y-.1,z]);cushions.push(c);return c}
  for(const {x,z} of [...HALL_SEATS,...HALL_GARDEN_SEATS])cushion(x,z);
  host.dataset.hallSeats=String(HALL_SEATS.length);
  // Bell pavilion, with an animated cast bronze bell.
  const tower=new T.Group();tower.position.set(BELL_PAVILION.x,0,BELL_PAVILION.z);scene.add(tower);
  box(6.8,.5,6.8,0,.25,0,stone,tower);box(5.7,.3,5.7,0,.65,0,stoneLight,tower);
  for(const x of [-2.3,2.3])for(const z of [-2.3,2.3]){cylinder(.2,.28,4.8,x,3.2,z,wood,tower);box(.28,.2,5.2,x,5.2,0,woodLight,tower)}roof(8,8,7.15,tower);
  const bellPivot=new T.Group();bellPivot.userData.dynamic=true;bellPivot.position.set(0,4.7,0);tower.add(bellPivot);
  const profile=[new T.Vector2(.35,0),new T.Vector2(.38,-.15),new T.Vector2(.65,-.3),new T.Vector2(.72,-1.3),new T.Vector2(.88,-1.55),new T.Vector2(.9,-1.7)];
  mesh(new T.LatheGeometry(profile,24),gold,bellPivot);for(const y of [-.3,-1.35,-1.65]){const ring=mesh(new T.TorusGeometry(y===-.3?.65:.87,.035,6,24),woodLight,bellPivot);ring.rotation.x=Math.PI/2;ring.position.y=y}
  tube([[0,0,0],[0,.5,0]],.1,gold,bellPivot);tube([[.9,2.6,0],[1.2,1,0]],.045,woodLight,tower);action(tower,'bell',[ZONES.bell.point[0],0,ZONES.bell.point[1]]);let bellStrike=-100;
  const fish=buildHallFurnishings({scene,box,cylinder,ball,tube,mesh,mat,wood,woodLight,stone,gold,dark,action});
  let fishStrike=-100;
  // Pond with shader ripples. All flowers are original geometry.
  box(pondWidth,.35,pondDepth,0,-1.02,pondCenter,mat('pond-bed','#2d5649'));
  const koi=buildPondKoi(scene,LOTUS_POND);
  host.dataset.pondFish=String(koi.count);
  const waterMat=new T.ShaderMaterial({
    uniforms:{time:{value:0},clearWater:{value:0},tint:{value:new T.Color('#2f6962')},sky:{value:new T.Color('#e8d5b4')},night:{value:0}},
    vertexShader:`
      varying vec3 vWorld;
      varying vec2 vWaterUV;
      void main(){
        vec4 world=modelMatrix*vec4(position,1.);
        vWorld=world.xyz;
        vWaterUV=uv;
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform float time;
      uniform vec3 tint;
      uniform vec3 sky;
      uniform float night;
      uniform float clearWater;
      varying vec3 vWorld;
      varying vec2 vWaterUV;
      void main(){
        vec2 p=vWorld.xz;
        float swell=sin(dot(p,vec2(.57,.92))+time*.9);
        float ripple=sin(dot(p,vec2(1.88,-.72))-time*1.26);
        float fine=sin(dot(p,vec2(4.1,2.7))+time*1.9);
        vec3 normal=normalize(vec3(swell*.043+ripple*.019,1.,ripple*.037+fine*.008));
        vec3 eye=normalize(cameraPosition-vWorld);
        float fresnel=.13+.68*pow(1.-max(dot(normal,eye),0.),4.);
        float shore=min(min(vWaterUV.x,1.-vWaterUV.x),min(vWaterUV.y,1.-vWaterUV.y));
        float shallow=1.-smoothstep(.006,.19,shore);
        vec3 bed=tint*(.87+shallow*.55)+vec3(.006,.019,.008)*(swell+ripple);
        vec3 reflected=mix(vec3(.34,.49,.53),sky,smoothstep(.04,.72,reflect(-eye,normal).y));
        vec3 col=mix(bed,reflected,fresnel);
        float light=max(dot(reflect(normalize(vec3(.45,-1.,-.38)),normal),eye),0.);
        col+=vec3(.91,.72,.45)*(pow(light,82.)*.25+pow(light,260.)*.4)*(1.-night);
        float opacity=mix(1.,clamp(.39+fresnel*.52+night*.25,0.,.95),clearWater);
        gl_FragColor=vec4(col*(1.-night*.66),opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const clearWater=waterMat.clone();
  clearWater.uniforms={...waterMat.uniforms,clearWater:{value:1}};
  clearWater.transparent=true;
  const water=mesh(new T.PlaneGeometry(pondWidth,pondDepth),clearWater);
  water.rotation.x=-Math.PI/2;
  water.position.set(0,-.06,pondCenter);
  water.castShadow=false;water.receiveShadow=false;
  action(water,'lantern',[ZONES.pond.point[0],0,ZONES.pond.point[1]]);
  for(const z of [LOTUS_POND.northBank,LOTUS_POND.southBank]){
    box(pondWidth,.98,.45,0,-.37,z,stone);
  }
  for(const x of [-LOTUS_POND.halfWidth,LOTUS_POND.halfWidth]){
    box(.55,.98,pondDepth,x,-.37,pondCenter,stone);
  }
  const padGeo=new T.CircleGeometry(1.05,16),petalGeo=new T.SphereGeometry(1,8,6),pink=mat('lotus-pink','#dca3a0'),pinkLight=mat('lotus-light','#efd1b4'),padMat=mat('pad','#577854',{side:T.DoubleSide});
  function lotus(x,z,size=.7,parent=scene,lit=false){const g=new T.Group();g.position.set(x,.02,z);g.scale.setScalar(size);parent.add(g);const pad=mesh(padGeo,padMat,g);pad.rotation.x=-Math.PI/2;pad.position.y=-.025;pad.castShadow=false;
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const p=mesh(petalGeo,i%2?pink:pinkLight,g);p.scale.set(.2,.15,.5);p.position.set(Math.sin(a)*.34,.14,Math.cos(a)*.34);p.rotation.y=a;p.rotation.x=.35}
    cylinder(.17,.2,.13,0,.2,0,lit?warm:gold,g,10);if(lit){const flame=ball(.07,.16,.07,0,.39,0,warm,g);g.userData.flame=flame}return g}
  // Leave an open reflection lane around the bridge. Lotus clusters follow the banks.
  for(let i=0;i<60;i++){
    const side=i%2===0?-1:1;
    const x=side*(6+random()*(LOTUS_POND.halfWidth-7));
    const z=i%4<2?LOTUS_POND.northBank+.8+random()*4:LOTUS_POND.southBank-.8-random()*4;
    lotus(x,z,.42+random()*.53);
  }
  const arch=z=>.1+lotusBridgeRise(z);
  const bridgeSegments=26;
  const segmentDepth=pondDepth/bridgeSegments;
  for(let i=0;i<bridgeSegments;i++){
    const z=LOTUS_POND.northBank+(i+.5)*segmentDepth;
    walk(box(5.3,.22,segmentDepth+.045,0,arch(z),z,stoneLight));
  }
  for(const x of [-2.7,2.7]){
    const rail=[];
    for(let i=0;i<=pondDepth;i++){
      const z=LOTUS_POND.northBank+i;
      rail.push([x,arch(z)+1,z]);
      if(i%2===0){
        box(.2,1.2,.25,x,arch(z)+.5,z,stone);
        ball(.2,.21,.2,x,arch(z)+1.15,z,stoneLight);
      }
    }
    tube(rail,.16,stoneLight);
  }
  brickWalk(19,8,0,LOTUS_POND.southBank+4,.2);
  // A fictional tam quan, visible when turning back towards the entrance.
  const gate=new T.Group();
  gate.position.z=LOTUS_POND.southBank+4;
  scene.add(gate);
  for(const x of [-6,-2.5,2.5,6]){box(.65,4.4,.65,x,2.1,0,stone,gate);box(.85,.2,.85,x,4.3,0,stoneLight,gate)}
  box(14,.6,1.3,0,4.1,0,stone,gate);roof(15,4,6.4,gate);action(gate,'gate',[0,0,LOTUS_POND.southBank+2]);
  // Licensed CC0 scanned tree, rendered as actual foliage with alpha cutout.
  cushion(31.5,3);
  const gltfLoader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const fair=buildFair({scene,box,cylinder,ball,tube,mat:color=>mat('fair-'+color,color),action,wood,woodLight,gold,warm});
  const campus=buildCampus({scene,box,cylinder,ball,tube,mesh,mat,wood,woodLight,stone,stoneLight,gold,warm,roof,walk,action,cushion,waterMat,lotus});
  host.dataset.precinctStatues=String(campus.statueCount);
  const parking=buildParking({scene,box,cylinder,ball,mesh,mat,walk});
  host.dataset.parkedCars=String(parking.count);
  gltfLoader.load('/assets/r4/lion-head.glb',gltf=>{for(const x of [-7.5,7.5]){const ornament=gltf.scene.clone(true),bounds=new T.Box3().setFromObject(ornament),size=bounds.getSize(new T.Vector3());ornament.scale.setScalar(1.15/Math.max(size.x,size.y,size.z));ornament.position.set(x,1.7,105);ornament.rotation.y=x<0?.35:-.35;scene.add(ornament);box(1.6,1.4,1.6,x,.7,105,stoneLight)}host.dataset.ornaments='ready'});
  const treeSites=[[34,-2,1.6],[-33,-25,1.9],[32,-27,2.4],[-36,7,2.2],[36,7,2.5],[-19,-43,2.4],[16,-43,2.7],...campus.treeSites];
  gltfLoader.load('/assets/r4/vegetation/island-tree-near.glb',gltf=>{for(const [x,z,scale] of treeSites.slice(0,2)){const object=gltf.scene.clone(true);object.userData.detailTree=true;object.position.set(x,-.1,z);object.scale.setScalar(scale);object.rotation.y=random()*6;object.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;if(m.material?.alphaTest){m.material.side=T.DoubleSide;m.material.shadowSide=T.DoubleSide}}});scene.add(object)}setQuality(quality);host.dataset.tree='ready'},undefined,e=>console.warn('Tree unavailable',e));
  gltfLoader.load('/assets/r4/vegetation/island-tree-far.glb',gltf=>{const sites=[];for(let i=0;i<38;i++){const x=-78+i*4.2;sites.push([x,-44-random()*12,2.8+random()*1.6])}for(let i=0;i<10;i++){sites.push([-35-random()*8,-25+i*5,2.8+random()*1.2]);sites.push([35+random()*8,-25+i*5,2.8+random()*1.2])}sites.push(...campus.forestSites,...treeSites.slice(2));for(let i=sites.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[sites[i],sites[j]]=[sites[j],sites[i]]}gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(source=>{if(!source.isMesh)return;const forest=new T.InstancedMesh(source.geometry,source.material,sites.length),transform=new T.Object3D();sites.forEach(([x,z,scale],i)=>{transform.position.set(x,-.3,z);transform.scale.setScalar(scale);transform.rotation.y=i*2.399;transform.updateMatrix();forest.setMatrixAt(i,transform.matrix.clone().multiply(source.matrixWorld))});forest.userData.forest=true;forest.userData.fullCount=sites.length;forest.receiveShadow=true;forest.castShadow=false;scene.add(forest)});setQuality(quality);host.dataset.forest='ready'});
  gltfLoader.load('/assets/r3/rock_moss_set_01/rock_moss_set_01_1k.gltf',gltf=>{for(const [x,z,scale] of [[-21,9,1.4],[21,10,1.2],[29,3,1],[-32,-14,1.6]]){const rock=gltf.scene.clone(true);rock.position.set(x,.05,z);rock.scale.setScalar(scale);rock.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});scene.add(rock)}host.dataset.rocks='ready'});
  // Bamboo in groups, all small leaves share one draw call.
  const leafGeo=new T.SphereGeometry(1,5,3),leaves=new T.InstancedMesh(leafGeo,leafMat,700);leaves.castShadow=true;scene.add(leaves);const temp=new T.Object3D();let li=0;
  for(const [cx,cz] of [[-36,-15],[35,-14],[-34,-31],[34,-33]])for(let i=0;i<8;i++){const x=cx+(random()-.5)*4,z=cz+(random()-.5)*4,h=6+random()*4;const stalk=cylinder(.055,.1,h,x,h/2,z,mat('bamboo','#71824c'),scene,6);stalk.rotation.z=(random()-.5)*.12;for(let j=0;j<18;j++){const a=random()*Math.PI*2;temp.position.set(x+Math.sin(a)*(.3+random()),h*.45+random()*h*.5,z+Math.cos(a)*(.3+random()));temp.scale.set(.08,.05,.5+random()*.3);temp.rotation.set(random(),a,.3);temp.updateMatrix();leaves.setMatrixAt(li++,temp.matrix)}}leaves.count=li;
  function stoneLamp(x,z){box(.75,.3,.75,x,.15,z,stone);box(.3,1,.3,x,.75,z,stone);box(.8,.12,.8,x,1.25,z,stone);box(.48,.5,.48,x,1.53,z,warm);cylinder(.65,.3,.35,x,1.95,z,stone,scene,4).rotation.y=Math.PI/4;glowing.push({})}
  for(const x of [-30.5,30.5])for(const z of [-11,5,12])stoneLamp(x,z);
  for(const z of [9]){box(1,.45,1,-11,.2,z,stone);cylinder(.75,.5,.8,-11,.8,z,stoneLight);for(let i=0;i<4;i++)ball(.45,.4,.45,-11+(random()-.5)*.8,1.35,z+(random()-.5)*.7,leafMat)}
  let initialAppearance={};try{initialAppearance=JSON.parse(localStorage.getItem('hien-an-avatar')||'{}')}catch{}const localVisitor=createVisitor({name:'Bạn',local:true,appearance:initialAppearance});const avatar=localVisitor.root;avatar.position.set(0,.15,6);scene.add(avatar);
  const remoteVisitors=new Map(),playedGreetings=new Map(),bodies=createBodyGrid();
  const liveSimple=createSimplePeople(scene,CAPACITY),liveRigPool=[];
  const liveTint=CLOTH_PALETTE.map(color=>new T.Color(color).toArray());
  const liveFrustum=new T.Frustum(),liveProjection=new T.Matrix4(),liveBounds=new T.Sphere(new T.Vector3(),1.4);
  const livePose={idle:0,walk:1,greet:2,meditate:3,prostrate:4};
  let detailChecked=-Infinity, guestLabel=null;
  let greetingPlaybackCount=0;let occupied=new Set(),currentSeat=null,localWalking=false,pendingTravel=null,postTravelSeat=null;const crowd=createCrowd({scene,host});
  const traffic=createParkingTraffic({scene,host,models:parking.cars,bodies,crowd});
  function placeAwayFromTraffic(position,point){
    if(!traffic.blocks(point,point.x,point.z)){position.set(point.x,point.y,point.z);return}
    const safe=arrivalPoints(point.x,point.z,true).find(candidate=>!traffic.blocks(candidate,candidate.x,candidate.z));
    if(safe)position.set(safe.x,groundHeight(safe.x,safe.z),safe.z);
  }
  function releaseRig(visitor){
    if(!visitor.rig)return;
    const slot=liveRigPool.find(slot=>slot.rig===visitor.rig);
    slot.visitor=null;
    visitor.rig.root.visible=false;
    visitor.rig=null;
  }
  function setParticipants(players){
    const ids=new Set(players.map(p=>p.id));
    for(const [id,visitor] of remoteVisitors){
      if(ids.has(id))continue;
      releaseRig(visitor);
      remoteVisitors.delete(id);
    }
    occupied=new Set(players.map(p=>p.seat).filter(Boolean));
    const received=performance.now();
    for(const p of players){
      let visitor=remoteVisitors.get(p.id);
      if(!visitor){
        const body=new T.Object3D();
        placeAwayFromTraffic(body.position,p);
        body.rotation.y=p.yaw;
        visitor={id:p.id,name:p.name,body,rig:null,target:new T.Vector3(p.x,p.y,p.z),route:[],yaw:p.yaw,pose:p.pose,received,greetingQueue:[],greetingUntil:0,phase:(parseInt(p.id.slice(0,4),16)||0)%100/16};
        remoteVisitors.set(p.id,visitor);
        detailChecked=-Infinity;
      }
      visitor.received=received;
      if(p.seq<visitor.seq)continue;
      visitor.seq=p.seq;
      visitor.appearance=p.appearance;
      visitor.rig?.setAppearance(p.appearance);
      if(visitor.target.x!==p.x||visitor.target.z!==p.z){
        const body=visitor.body.position;
        if(Math.hypot(p.x-body.x,p.z-body.z)>5||!validPosition(body.x,body.z)){
          placeAwayFromTraffic(body,p);
          visitor.route=[];
        }else{
          visitor.route=clearSegment(body,p)?[p]:findPath(body,p)||[];
        }
        visitor.target.set(p.x,p.y,p.z);
      }
      visitor.yaw=p.yaw;
      visitor.pose=p.pose==='greet'&&Array.isArray(p.greetings)?'idle':p.pose;
      visitor.received=received;
    }
    receiveGreetings(players);
    host.dataset.remotePlayers=String(remoteVisitors.size);
    host.dataset.remoteStates=JSON.stringify(players.map(p=>({id:p.id,x:p.x,z:p.z,pose:p.pose,seat:p.seat})));
  }
  function selectLiveRigs(active,now){
    if(now-detailChecked<350)return;
    detailChecked=now;
    const budget=quality==='light'?6:quality==='high'?12:8;
    liveFrustum.setFromProjectionMatrix(liveProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    const candidates=active.map(visitor=>{
      const position=visitor.body.position;
      liveBounds.center.copy(position);
      liveBounds.center.y+=.8;
      return {visitor,distance:position.distanceToSquared(camera.position),visible:liveFrustum.intersectsSphere(liveBounds)};
    });
    const selected=candidates.filter(entry=>active.length<=budget||entry.visible)
      .sort((a,b)=>a.distance-b.distance).slice(0,budget).map(entry=>entry.visitor);
    const wanted=new Set(selected);
    for(const slot of liveRigPool)if(slot.visitor&&!wanted.has(slot.visitor))releaseRig(slot.visitor);
    for(const visitor of selected){
      if(visitor.rig)continue;
      let slot=liveRigPool.find(slot=>!slot.visitor);
      if(!slot){
        const rig=createVisitor({name:'',appearance:visitor.appearance,castShadow:false});
        scene.add(rig.root);
        slot={rig,visitor:null};
        liveRigPool.push(slot);
      }
      slot.visitor=visitor;
      visitor.rig=slot.rig;
      visitor.rig.setAppearance(visitor.appearance);
    }
  }
  function receiveGreetings(players){
    const received=performance.now();
    for(const [id,until] of playedGreetings)if(until<received)playedGreetings.delete(id);
    for(const player of players){
      const visitor=remoteVisitors.get(player.id);
      if(!visitor)continue;
      for(const event of player.greetings??[]){
        if(playedGreetings.has(event.id)||visitor.greetingQueue.some(queued=>queued.id===event.id))continue;
        if(visitor.greetingQueue.length===GREETING_LIMIT)visitor.greetingQueue.shift();
        visitor.greetingQueue.push({id:event.id,expires:received+GREETING_WINDOW_MS});
      }
    }
  }
  function reconcile(p,{resumeRoute=false}={}){
    if(!p)return;
    const target=resumeRoute?path.at(-1):null;
    const onArrival=arrival;
    const seatId=postTravelSeat||(resumeRoute&&seated?currentSeat:null);
    pendingTravel=null;path=[];arrival=null;postTravelSeat=null;
    seated=p.pose==='meditate';currentSeat=p.seat;
    placeAwayFromTraffic(avatar.position,p);avatar.rotation.y=p.yaw;
    if(seatId){
      const seat=seatId==='nearest-hall'?availableHallSeat():SEATS.find(s=>s.id===seatId);
      if(seat)requestSeat(seat.x,seat.z);
    }else if(target){
      navigate(target.x,target.z,onArrival);
    }
  }
  function requestSeat(x,z){
    const seat=SEATS.find(p=>Math.hypot(p.x-x,p.z-z)<.2);
    if(!seat)return;
    if(occupied.has(seat.id)){onStatus('Bồ đoàn đã có người. Mời bạn chọn chỗ khác.');return}
    if(pendingTravel==='temple'&&seat.id.startsWith('hall:'))postTravelSeat=seat.id;
    navigate(x,z,()=>{
      if(occupied.has(seat.id)){onStatus('Bồ đoàn vừa có người ngồi. Mời bạn chọn chỗ khác.');return}
      currentSeat=seat.id;
      seated=true;
      if(seat.id.startsWith('hall:'))avatar.rotation.y=Math.PI;
      onSeat?.();
      onStatus('Bạn đã ngồi xuống. Chạm sân để đứng dậy.');
      onContext({type:'breathe',label:'Ngồi yên tại đây'});
    });
  }
  const destination=mesh(new T.RingGeometry(.32,.4,32),new T.MeshBasicMaterial({color:'#d9b86b',transparent:true,opacity:.7,side:T.DoubleSide}));destination.rotation.x=-Math.PI/2;destination.visible=false;scene.add(destination);
  let path=[],seated=false,arrival=null,bowUntil=0,prostrateUntil=0,disposed=false,reduced=false,quality='balanced',timeOfDay='afternoon',frame=0,last=performance.now(),lastRender=0,fpsFrames=0,fpsStart=last,measuredFps=0,cameraTween=null,follow=false,paradeTracking=false,lionShot=false,context=null,stalledSince=0;
  let hallView='exterior',fitHall=false,wasOnHallDeck=false;
  const navAnchors=Object.fromEntries(Object.entries(ZONES).map(([id,p])=>[id,{point:[p.point[0],groundHeight(...p.point),p.point[1]],camera:p.camera,look:p.look}]));
  const valid=validPosition,groundY=groundHeight;
  function navigate(x,z,callback){stalledSince=0;const route=findPath({x:avatar.position.x,z:avatar.position.z},{x,z});if(!route){onStatus('Chọn khoảng sân hoặc một bồ đoàn có lối đi.');return false}onWalk?.();seated=false;currentSeat=null;arrival=callback||null;path=route.map(p=>new T.Vector3(p.x,groundY(p.x,p.z),p.z));destination.position.set(x,groundY(x,z)+.02,z);destination.visible=true;return true}
  function cameraTo(position,target,fit=true,instant=false){if(fit&&isPortrait()){const look=new T.Vector3(...target);position=new T.Vector3(...position).sub(look).multiplyScalar(1.3).add(look).toArray()}cameraTween={fromP:camera.position.clone(),fromT:controls.target.clone(),toP:new T.Vector3(...position),toT:new T.Vector3(...target),start:performance.now(),duration:reduced||instant?1:1200};follow=false}
  function setHallView(mode){
    hallView=mode;
    hallCover.visible=hallCoverBatches.visible=mode!=='overview';
    host.dataset.hallView=mode;
    onHallView?.(mode);
    if((mode==='exterior'||mode==='overview')&&camera.fov!==55){camera.fov=55;camera.updateProjectionMatrix()}
    if(mode==='exterior')fitHall=false;
  }
  function frameFacade(instant=false){
    const {position,target,fov}=facadeShot();
    camera.fov=fov;
    camera.updateProjectionMatrix();
    cameraTo(position,target,false,instant);
  }
  function frameInterior(instant=false){
    camera.fov=isPortrait()?82:55;
    camera.updateProjectionMatrix();
    const position=isPortrait()?[.35,5.55,-4.7]:[1.1,5.65,-7.8];
    cameraTo(position,[0,4.5,-32],false,instant);
  }
  function frameHall(instant=false){
    const target=new T.Vector3(0,HALL_DECK.height+2,(HALL_DECK.front+HALL_DECK.back)/2);
    const back=new T.Vector3(0,.8,.6);
    const up=new T.Vector3(0,back.z,-back.y);
    const vertical=Math.tan(T.MathUtils.degToRad(camera.fov/2));
    const horizontal=vertical*camera.aspect;
    const compactLandscape=camera.aspect>1&&host.clientHeight<=500;
    const safeX=isPortrait()?.92:.83,safeY=compactLandscape?.53:.63;
    let distance=0;
    // Fit the platform, back wall and statue in a viewport clear of the controls.
    for(const x of [-HALL_DECK.halfWidth,HALL_DECK.halfWidth]){
      for(const [z,y] of [[HALL.stairFront,.15],[HALL_DECK.back,HALL_DECK.height],[HALL_DECK.back,10.7]]){
        const offset=new T.Vector3(x,y,z).sub(target);
        distance=Math.max(distance,offset.dot(back)+Math.max(
          Math.abs(offset.x)/(horizontal*safeX),
          Math.abs(offset.dot(up))/(vertical*safeY)
        ));
      }
    }
    cameraTo(target.clone().addScaledVector(back,distance+1.25).toArray(),target.toArray(),false,instant);
  }
  function view(name){
    paradeTracking=name==='parade';lionShot=name==='lion';
    if(name==='temple'||name==='hall-interior'||name==='hall-seats'){
      const mode=name==='temple'?'facade':name==='hall-interior'?'interior':'overview';
      const switching=hallView!=='exterior'&&mode!==hallView;
      setHallView(mode);
      fitHall=true;
      if(mode==='overview')frameHall(switching);
      else if(mode==='interior')frameInterior(switching);
      else frameFacade(switching);
      return;
    }
    setHallView('exterior');
    if(paradeTracking){
      const shot=fair.paradeCamera(performance.now(),reduced,isPortrait());
      cameraTo(shot.position,shot.target,false);return;
    }
    if(name==='lion'){
      cameraTo([LION_POINT.x+3.2,3.45,LION_POINT.z+6.7],[LION_POINT.x,1.24,LION_POINT.z],false);return;
    }
    if(name==='home'||name==='overview'){cameraTo(isPortrait()?[237,182,212]:[180,133,170],[0,10,-39],false);return}
    if(name==='follow'){cameraTo([avatar.position.x+5,avatar.position.y+3.5,avatar.position.z+8],[avatar.position.x,avatar.position.y+1,avatar.position.z],false);follow=true;return}
    if(name==='parking'&&isPortrait()){cameraTo([62,11,63],[79,1,48]);return}
    const p=navAnchors[name];if(p)cameraTo(p.camera,p.look);
  }
  function go(name){
    if(name==='seat-hall'||name==='seat-tree'||name==='seat-zen'){
      sitAt(name==='seat-tree'?'tree':name==='seat-zen'?'zen':'hall');return;
    }
    const p=navAnchors[name];
    if(!p)return;
    const [x,,z]=p.point;
    const transfer=Math.hypot(avatar.position.x-x,avatar.position.z-z)>30||
      name==='temple'&&!onHallDeck(avatar.position.x,avatar.position.z);
    const points=transfer?destinationPoints(name,x,z):arrivalPoints(x,z,true);
    const free=points.find(point=>!bodies.blocks(point,point.x,point.z,avatar.position)&&!crowd.blocks(point,point.x,point.z)&&!traffic.blocks(point,point.x,point.z));
    if(transfer){
      onWalk?.();path=[];arrival=null;seated=false;currentSeat=null;pendingTravel=name;
      if(free)avatar.position.set(free.x,groundY(free.x,free.z),free.z);
      avatar.rotation.y=Math.PI;onStatus('Đã chuyển đến '+ZONES[name].name+'.');
    }else if(free)navigate(free.x,free.z);
    view(name);
  }
  function availableHallSeat(){
    const {x,z}=avatar.position;
    return HALL_SEATS.filter(seat=>!occupied.has(seat.id)&&!bodies.blocks(seat,seat.x,seat.z,avatar.position))
      .sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];
  }
  function sitAt(name){
    if(name==='hall'&&!onHallDeck(avatar.position.x,avatar.position.z)){
      go('temple');
      if(onHallDeck(avatar.position.x,avatar.position.z)){
        const seat=availableHallSeat();
        if(seat)requestSeat(seat.x,seat.z);
      }
      if(pendingTravel)postTravelSeat='nearest-hall';
      return;
    }
    const candidates=SEATS.filter(p=>name==='tree'?p.id==='bodhi':p.id.startsWith('zen:'));
    const seat=name==='hall'?availableHallSeat():candidates.sort((a,b)=>Math.abs(a.x)-Math.abs(b.x)).find(p=>!occupied.has(p.id));
    if(!seat){onStatus('Các bồ đoàn ở đây đã có người. Mời bạn chọn khu vực khác.');return}
    const zone=name==='zen'?'meditation':name==='tree'?'tree':'temple';
    if(name!=='hall'&&Math.hypot(avatar.position.x-seat.x,avatar.position.z-seat.z)>30){
      go(zone);postTravelSeat=seat.id;
    }else requestSeat(seat.x,seat.z);
    if(name==='hall'&&pendingTravel==='temple')postTravelSeat='nearest-hall';
    if(name!=='hall'||hallView==='exterior')view(zone);
  }
  function addLantern(){const x=8+random()*10,z=pondCenter-4+random()*8;const l=lotus(x,z,1.15,scene,true);pondLanterns.push({mesh:l,x,z,born:performance.now()});if(pondLanterns.length>12){const old=pondLanterns.shift();scene.remove(old.mesh)}return l}
  function act(type){host.dataset.lastAction=type;if(type==='stop-prostrate'){prostrateUntil=0}else if(type==='prostrate'){seated=false;currentSeat=null;bowUntil=0;prostrateUntil=performance.now()+3300;path=[];}else if(type==='bell'){bellStrike=performance.now();}else if(type==='bow'){seated=false;currentSeat=null;prostrateUntil=0;bowUntil=performance.now()+2200;path=[];}else if(type==='wood'){fishStrike=performance.now();}else if(type==='incense'){incenseUntil=performance.now()+35000;}else if(type==='lantern'){addLantern();view('pond')}else if(type==='stand'){seated=false;currentSeat=null;onStatus('Bạn đã đứng dậy. Chạm sân để đi tiếp.')}else if(type==='clear'){pondLanterns.forEach(l=>scene.remove(l.mesh));pondLanterns.length=0}}
  const dayPresets={morning:{sky:'#d6e3d5',sun:'#fff0d4',power:2.3,hemi:.55,exposure:1.05},afternoon:{sky:'#d9dfcb',sun:'#ffdfad',power:2.5,hemi:.55,exposure:1.05},night:{sky:'#253d45',sun:'#abcad5',power:.4,hemi:.7,exposure:.95}};
  function setTime(value){timeOfDay=value;const p=dayPresets[value]||dayPresets.afternoon;scene.background=new T.Color(value==='night'?p.sky:'#cbd5d1');scene.fog.color.set(value==='night'?p.sky:'#afc3c4');skyDome.visible=value!=='night';skyDome.material.uniforms.sunPosition.value.set(-.45,value==='morning'?.32:.5,.45);scene.environmentIntensity=value==='night'?.18:.7;sun.color.set(p.sun);sun.intensity=p.power;hemi.intensity=p.hemi;renderer.toneMappingExposure=p.exposure;waterMat.uniforms.sky.value.set(p.sky);waterMat.uniforms.night.value=value==='night'?1:0;warm.emissiveIntensity=value==='night'?2.1:.8}
  function setQuality(value){quality=value;crowd.configure({quality:value});host.dataset.quality=value;const light=value==='light';renderer.setPixelRatio(Math.min(devicePixelRatio,light?1:value==='high'?2:1.5));renderer.shadowMap.enabled=!light;sun.shadow.mapSize.set(value==='high'?2048:1024,value==='high'?2048:1024);sun.shadow.map?.dispose();sun.shadow.map=null;renderer.setSize(host.clientWidth,host.clientHeight);scene.traverse(o=>{if(o.userData.forest)o.count=light?Math.ceil(o.userData.fullCount*.6):o.userData.fullCount;if(o.userData.detailTree)o.visible=!light||Math.abs(o.position.x)<22})}
  function setReduced(value){reduced=value;crowd.configure({reduced:value});controls.enableDamping=!value}
  function setEnabled(value){controls.enabled=value;if(!value){path=[];destination.visible=false}}
  function zoom(direction){fitHall=false;const delta=camera.position.clone().sub(controls.target);delta.multiplyScalar(direction>0?.82:1.22);const len=T.MathUtils.clamp(delta.length(),controls.minDistance,controls.maxDistance);delta.setLength(len);camera.position.copy(controls.target).add(delta);controls.update();cameraTween=null}
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();let down=null,multiTouch=false,activePointers=new Set();
  function pick(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects([...pickables,...walkables],true)[0]}
  const guestSphere=new T.Sphere(),guestHit=new T.Vector3();
  function clearGuestLabel(){
    if(!guestLabel)return;
    scene.remove(guestLabel.sprite);
    guestLabel.sprite.material.map.dispose();
    guestLabel.sprite.material.dispose();
    guestLabel=null;
  }
  function pickGuest(maxDistance){
    let picked;
    for(const guest of remoteVisitors.values()){
      guestSphere.center.copy(guest.body.position);
      const seated=guest.pose==='meditate';
      guestSphere.center.y+=seated?.53:.94;
      guestSphere.radius=seated?.58:.77;
      if(!raycaster.ray.intersectSphere(guestSphere,guestHit))continue;
      const distance=raycaster.ray.origin.distanceTo(guestHit);
      if(distance>=maxDistance)continue;
      picked=guest;maxDistance=distance;
    }
    if(!picked)return false;
    clearGuestLabel();
    const sprite=labelSprite(picked.name);
    sprite.userData.dynamic=true;
    guestLabel={visitor:picked,sprite,until:performance.now()+3800};
    scene.add(sprite);
    return true;
  }
  function pointerDown(e){activePointers.add(e.pointerId);if(activePointers.size>1){multiTouch=true;down=null;return}down={x:e.clientX,y:e.clientY,time:performance.now()}}
  function pointerUp(e){activePointers.delete(e.pointerId);if(multiTouch){if(activePointers.size===0)multiTouch=false;down=null;return}if(!down||!controls.enabled)return;const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;if(moved>7)return;cameraTween=null;paradeTracking=false;lionShot=false;const hit=pick(e);if(pickGuest(hit?.distance??Infinity)||!hit)return;let obj=hit.object;while(obj&&!obj.userData.action&&!obj.userData.walkable)obj=obj.parent;if(!obj)return;const data=obj.userData;
    if(data.action){const target=data.target;if(data.action==='seat'){requestSeat(target[0],target[2]);return}if(data.action==='gate'){go('gate');return}if(data.action==='tree'){go('tree');return}if(target)navigate(target[0],target[2]);onAction(data.action)}else {follow=true;navigate(hit.point.x,hit.point.z)}}
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',()=>{down=null;multiTouch=false;activePointers.clear()});
  controls.addEventListener('start',()=>{fitHall=false;cameraTween=null;follow=false;paradeTracking=false;lionShot=false});
  function moveKey(key){fitHall=false;paradeTracking=false;lionShot=false;const forward=new T.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new T.Vector3().crossVectors(forward,new T.Vector3(0,1,0));let direction=forward;if(key==='s'||key==='ArrowDown')direction=forward.multiplyScalar(-1);if(key==='a'||key==='ArrowLeft')direction=right.multiplyScalar(-1);if(key==='d'||key==='ArrowRight')direction=right;const x=avatar.position.x+direction.x*1.5,z=avatar.position.z+direction.z*1.5;follow=true;return navigate(x,z)}
  // Merge static meshes by material while retaining their invisible picking meshes.
  // This keeps repeated roof, flowers, timber and stone to a few draw calls.
  scene.updateMatrixWorld(true);
  const buckets=new Map();
  scene.traverse(object=>{
    if(!object.isMesh||object.isInstancedMesh||!object.material?.isMeshStandardMaterial)return;
    let parent=object,batchParent=scene;
    while(parent){
      if(parent.userData.dynamic)return;
      if(parent===hallCover)batchParent=hallCoverBatches;
      parent=parent.parent;
    }
    const source=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();source.applyMatrix4(object.matrixWorld);
    if(!source.attributes.normal)source.computeVertexNormals();
    const key=batchParent.id+':'+object.material.uuid+':'+Math.floor(object.matrixWorld.elements[12]/42)+':'+Math.floor(object.matrixWorld.elements[14]/42);if(!buckets.has(key))buckets.set(key,{material:object.material,parts:[],batchParent});
    buckets.get(key).parts.push(source);object.visible=false;
  });
  for(const {material,parts,batchParent} of buckets.values()){
    const geometry=new T.BufferGeometry();
    for(const [name,itemSize] of [['position',3],['normal',3],['uv',2]]){
      const total=parts.reduce((n,g)=>n+g.attributes.position.count*itemSize,0),array=new Float32Array(total);let offset=0;
      for(const part of parts){const attr=part.attributes[name];if(attr)array.set(attr.array,offset);offset+=part.attributes.position.count*itemSize}
      geometry.setAttribute(name,new T.BufferAttribute(array,itemSize));
    }
    geometry.computeBoundingSphere();mesh(geometry,material,batchParent);parts.forEach(p=>p.dispose());
  }
  const anchor3d={bell:new T.Vector3(BELL_PAVILION.x,5,BELL_PAVILION.z),bow:new T.Vector3(0,8,-5),lantern:new T.Vector3(12,.4,pondCenter)};
  function updateMarkers(){for(const [name,el] of Object.entries(markers||{})){const v=anchor3d[name].clone().project(camera);const visible=v.z> -1&&v.z<1&&Math.abs(v.x)<.91&&Math.abs(v.y)<.78;el.style.left=T.MathUtils.clamp((v.x*.5+.5)*host.clientWidth,65,host.clientWidth-65)+'px';el.style.top=((-v.y*.5+.5)*100)+'%';el.style.opacity=visible?'1':'0';el.style.pointerEvents=visible?'auto':'none'}}
  const interactionSpots=[
    ...MARKET_CARTS.map(cart=>({x:cart.x,z:cart.z,type:cart.id,label:cart.name})),
    ...MARKET_STALLS.map(stall=>{const [x,z]=stallFront(stall);return {x,z,type:stall.id,label:stall.name}}),
    ...Object.values(ZONES).filter(z=>z.description&&z.action).map(z=>({x:z.point[0],z:z.point[1],type:z.action,label:z.name})),
    {x:ZONES.bell.point[0],z:ZONES.bell.point[1],type:'bell',label:'Thỉnh chuông'},
    {x:HALL_INCENSE.x,z:HALL_INCENSE.z+1.25,type:'incense',label:'Dâng hương'},
    ...HALL_FISHES.map(({x,z})=>({x,z:z+1.8,type:'wood',label:'Gõ mõ'})),{x:8,z:11,type:'lantern',label:'Thả hoa đăng'}
  ];
  function updateContext(){
    const next=lionShot?null:paradeTracking?{type:'fair-stop',label:'Dừng theo đoàn'}:seated?{type:'breathe',label:'Ngồi yên tại đây'}:
      interactionSpots.find(p=>Math.hypot(avatar.position.x-p.x,avatar.position.z-p.z)<3.8)||null;
    const key=next?.type||null;
    if(key!==context){context=key;onContext(next)}
  }
  let uiStamp=0;
  function animate(now){if(disposed||document.hidden)return;const limit=quality==='light'?1000/30:1000/60;if(now-lastRender<limit-1)return;const dt=Math.min((now-lastRender)/1000,.06)||.016;lastRender=now;frame++;fpsFrames++;if(now-fpsStart>1500){measuredFps=Math.round(fpsFrames*1000/(now-fpsStart));fpsFrames=0;fpsStart=now}
    if(paradeTracking&&!cameraTween){
      const shot=fair.paradeCamera(now,reduced,isPortrait()),amount=1-Math.exp(-dt*5);
      camera.position.lerp(new T.Vector3(...shot.position),amount);
      controls.target.lerp(new T.Vector3(...shot.target),amount);
    }
    if(cameraTween){const t=Math.min(1,(now-cameraTween.start)/cameraTween.duration),e=t*t*(3-2*t);camera.position.lerpVectors(cameraTween.fromP,cameraTween.toP,e);controls.target.lerpVectors(cameraTween.fromT,cameraTween.toT,e);if(t>=1)cameraTween=null}
    const localBody=avatar.position,activePeers=[];
    for(const r of remoteVisitors.values()){
      if(now-r.received<4500)activePeers.push(r);
      else if(r.rig)r.rig.root.visible=false;
    }
    bodies.replace([localBody,...activePeers.map(r=>r.body.position),...fair.bodies,...traffic.passengerBodies()]);
    const blocked=(from,x,z)=>bodies.blocks(from,x,z)||crowd.blocks(from,x,z)||traffic.blocks(from,x,z);
    let walking=false;
    const walkingTarget=path.at(-1);
    if(path.length){
      const target=path[0],dx=target.x-localBody.x,dz=target.z-localBody.z,distance=Math.hypot(dx,dz);
      const amount=Math.min(distance,dt*4.4);
      let step;
      if(distance<.15){
        const nx=distance?localBody.x+dx*amount/distance:localBody.x,nz=distance?localBody.z+dz*amount/distance:localBody.z;
        if(valid(nx,nz)&&!blocked(localBody,nx,nz))step={x:nx,z:nz,yaw:distance?Math.atan2(dx,dz):avatar.rotation.y};
      }else{
        step=steer(localBody,target.x,target.z,amount,(x,z)=>!clearSegment(localBody,{x,z})||blocked(localBody,x,z));
      }
      if(step){
        const shiftX=step.x-localBody.x,shiftZ=step.z-localBody.z;
        walking=Math.hypot(shiftX,shiftZ)>.005;
        stalledSince=0;bodies.move(localBody,step.x,step.z);localBody.y=groundY(step.x,step.z);
        if(follow){camera.position.x+=shiftX;camera.position.z+=shiftZ;controls.target.x+=shiftX;controls.target.z+=shiftZ}
        if(walking){
          const turn=step.yaw-avatar.rotation.y;
          avatar.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*12);
        }
        if(Math.hypot(localBody.x-target.x,localBody.z-target.z)<.01){
          path.shift();
          if(!path.length){destination.visible=false;const cb=arrival;arrival=null;cb?.()}
        }
      }else if(!stalledSince)stalledSince=now;
      else if(now-stalledSince>1800){
        path=[];arrival=null;destination.visible=false;onStatus('Lối đang bị chắn. Chạm một khoảng trống để đi tiếp.');
      }
    }
    const onDeck=onHallDeck(localBody.x,localBody.z);
    if(walking&&onDeck&&!wasOnHallDeck&&hallView==='exterior'&&walkingTarget&&onHallDeck(walkingTarget.x,walkingTarget.z))view('temple');
    if(!onDeck&&wasOnHallDeck&&hallView!=='exterior'){
      if(hallView==='overview')view('temple');
      else setHallView('exterior');
    }
    wasOnHallDeck=onDeck;
    localWalking=walking;
    localVisitor.update(seated?'meditate':now<prostrateUntil?'prostrate':now<bowUntil?'greet':walking?'walk':'idle',now);
    sun.target.position.set(controls.target.x,0,controls.target.z);sun.position.set(controls.target.x-24,38,controls.target.z+22);
    camera.updateMatrixWorld();
    selectLiveRigs(activePeers,now);
    let simpleCount=0;
    liveSimple.clock.value=reduced?0:now*.001;
    for(const r of activePeers){
      const body=r.body.position,target=r.route[0];
      let moving=false;
      if(target){
        const dx=target.x-body.x,dz=target.z-body.z,distance=Math.hypot(dx,dz);
        const amount=Math.min(distance,dt*7);
        const x=distance?body.x+dx*amount/distance:body.x,z=distance?body.z+dz*amount/distance:body.z;
        // NPCs yield when a visitor reaches their personal space.
        if(valid(x,z)&&clearSegment(body,{x,z})&&!blocked(body,x,z)){
          bodies.move(body,x,z);body.y=groundY(x,z);moving=amount>.005;
          if(distance-amount<.005)r.route.shift();
        }
      }
      const id=r.id;
      r.body.rotation.y+=Math.atan2(Math.sin(r.yaw-r.body.rotation.y),Math.cos(r.yaw-r.body.rotation.y))*Math.min(1,dt*12);
      if(now>=r.greetingUntil){
        while(r.greetingQueue.length&&r.greetingQueue[0].expires<=now)r.greetingQueue.shift();
        const event=r.greetingQueue.shift();
        if(event){
          r.greetingUntil=now+1450;
          playedGreetings.set(event.id,now+GREETING_WINDOW_MS);
          host.dataset.remoteGreeting=JSON.stringify({playerId:id,eventId:event.id,count:++greetingPlaybackCount});
        }
      }
      const pose=now<r.greetingUntil?'greet':r.pose==='walk'&&!moving?'idle':r.pose;
      if(r.rig){
        r.rig.root.visible=true;
        r.rig.root.position.copy(body);
        r.rig.root.rotation.y=r.body.rotation.y;
        r.rig.update(pose,now);
      }else{
        r.body.updateMatrix();
        liveSimple.far.setMatrixAt(simpleCount,r.body.matrix);
        liveSimple.params.set([1,r.phase,livePose[pose],1],simpleCount*4);
        liveSimple.tints.set(liveTint[r.appearance.palette]??liveTint[0],simpleCount*3);
        simpleCount++;
      }
    }
    if(guestLabel){
      const {visitor,sprite,until}=guestLabel;
      if(now>=until||!remoteVisitors.has(visitor.id))clearGuestLabel();
      else{
        sprite.position.copy(visitor.body.position);
        sprite.position.y+=visitor.pose==='meditate'?1.4:1.95;
      }
    }
    liveSimple.far.count=simpleCount;
    if(simpleCount){
      liveSimple.far.instanceMatrix.needsUpdate=true;
      liveSimple.far.geometry.attributes.crowdParams.needsUpdate=true;
      liveSimple.far.geometry.attributes.crowdTint.needsUpdate=true;
    }
    bellPivot.rotation.z=now-bellStrike<4500?Math.sin((now-bellStrike)*.007)*.18*Math.exp(-(now-bellStrike)/1700):0;for(const head of fish)head.scale.y=now-fishStrike<240?1-Math.sin((now-fishStrike)/240*Math.PI)*.08:1;
    const waterTime=reduced?0:now*.001;
    waterMat.uniforms.time.value=waterTime;
    koi.update(waterTime);skyDome.material.uniforms.time.value=reduced?0:now*.001;
    for(const l of pondLanterns){if(!reduced){l.mesh.position.x=l.x+Math.sin(now*.0003+l.z)*.5;l.mesh.position.z=l.z+Math.sin(now*.0002+l.x)*.35;l.mesh.position.y=.04+Math.sin(now*.002+l.x)*.025}}
    smoke.material.opacity=now<incenseUntil?.35:0;if(now<incenseUntil){for(let i=0;i<24;i++){const t=((now*.00014+i/24)%1);smokePos[i*3]=Math.sin(t*7+now*.0005)*t*.2;smokePos[i*3+1]=HALL_DECK.height+1.02+t*2.1;smokePos[i*3+2]=HALL_INCENSE.z+Math.cos(t*4)*t*.15}smokeGeo.attributes.position.needsUpdate=true}
    controls.update();fair.update(now,dt,camera,reduced,quality,crowd.getCount(),bodies,crowd.blocks);traffic.update(now,dt,camera,reduced);crowd.update(now,camera,bodies,traffic.blocks);updateMarkers();updateContext();renderer.render(scene,camera);
    if(now-uiStamp>350){uiStamp=now;traffic.report();host.dataset.frames=String(frame);host.dataset.fps=String(measuredFps);host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.position=`${avatar.position.x.toFixed(2)},${avatar.position.y.toFixed(2)},${avatar.position.z.toFixed(2)}`;host.dataset.camera=camera.position.toArray().map(n=>n.toFixed(2)).join(',');host.dataset.zone=nearestZone(avatar.position.x,avatar.position.z).id;host.dataset.avatar=String(localVisitor.root.userData.avatarAsset||'loading');host.dataset.fairActors=String(fair.visibleActors);host.dataset.fairLion=String(fair.visibleLion);host.dataset.fairParade=String(fair.visibleParade);host.dataset.fairTracking=String(paradeTracking);host.dataset.outfit=String(localVisitor.getAppearance().outfit);host.dataset.liveSimple=String(simpleCount);host.dataset.remoteModels=JSON.stringify(Array.from(remoteVisitors,([id,r])=>({id,model:r.rig?r.rig.root.userData.avatarAsset||'loading':'simple',profile:r.appearance.profile,outfit:r.appearance.outfit})));host.dataset.seated=String(seated);host.dataset.pose=seated?'seated':now<bowUntil?'bow':'standing';host.dataset.incenseActive=String(now<incenseUntil);host.dataset.bellAngle=bellPivot.rotation.z.toFixed(4);host.dataset.lanterns=String(pondLanterns.length)}
  }
  function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);if(fitHall&&w&&h){if(hallView==='overview')frameHall(true);else if(hallView==='interior')frameInterior(true);else frameFacade(true)}}const observer=new ResizeObserver(resize);observer.observe(host);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);onStatus('Cảnh 3D đã tạm dừng. Tải lại trang để mở lại.');host.dataset.context='lost'});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{renderer.setAnimationLoop(animate);host.dataset.context='ready'});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){renderer.setAnimationLoop(null)}else{lastRender=performance.now();fpsStart=lastRender;fpsFrames=0;renderer.setAnimationLoop(animate)}});
  host.dataset.renderer='Three.js';host.dataset.version=T.REVISION;host.dataset.context='ready';renderer.setAnimationLoop(animate);onReady?.();
  return {captureFrame(){renderer.render(scene,camera);return new Promise(resolve=>renderer.domElement.toBlob(resolve))},getLocalState:()=>({x:avatar.position.x,z:avatar.position.z,yaw:avatar.rotation.y,pose:seated?'meditate':performance.now()<prostrateUntil?'prostrate':performance.now()<bowUntil?'greet':localWalking?'walk':'idle',seat:seated?currentSeat:null,appearance:localVisitor.getAppearance(),travelTo:pendingTravel}),setCrowd:count=>crowd.setCount(count),setAppearance:value=>localVisitor.setAppearance(value),getAppearance:()=>localVisitor.getAppearance(),enter:()=>view('temple'),setParticipants,receiveGreetings,reconcile,act,go,view,setHallAngle:mode=>view({facade:'temple',interior:'hall-interior',overview:'hall-seats'}[mode]),sitAt,zoom,moveKey,setTime,setQuality,setReduced,setEnabled,stand:()=>act('stand'),getStats:()=>({revision:T.REVISION,frames:frame,fps:measuredFps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,position:avatar.position.toArray(),camera:camera.position.toArray(),quality}),dispose(){disposed=true;fair.dispose();traffic.dispose();crowd.dispose();liveSimple.dispose();clearGuestLabel();for(const slot of liveRigPool)slot.rig.dispose();localVisitor.dispose();renderer.setAnimationLoop(null);controls.dispose();observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});renderer.dispose()}};
}
