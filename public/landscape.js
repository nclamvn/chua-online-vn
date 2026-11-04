import * as T from './vendor/three.module.js';

// Original terrain. The lower saddle behind the approach leaves room for the temple roof.
const RIDGES=[
  {front:-211,depth:113,width:960,phase:.3,base:'#50786a',peak:'#73918a',
    summits:[[-370,47,54],[-243,60,38],[-157,35,30],[-48,42,28],[52,51,34],[150,63,41],[275,51,55],[401,40,43]]},
  {front:-305,depth:147,width:1200,phase:1.7,base:'#718e8a',peak:'#9ab2b3',
    summits:[[-470,61,60],[-349,82,48],[-211,65,42],[-122,51,39],[0,89,48],[110,70,44],[234,96,55],[385,83,61],[500,55,48]]},
  {front:-430,depth:188,width:1580,phase:3.1,base:'#8ca3a8',peak:'#a8bdc3',
    summits:[[-645,85,71],[-473,113,68],[-322,96,61],[-177,75,65],[-28,114,60],[145,120,60],[304,135,73],[469,109,63],[648,89,70]]},
  {front:-579,depth:196,width:1840,phase:4.5,base:'#a0b4bc',peak:'#b5c9cf',
    summits:[[-754,100,93],[-539,144,90],[-331,122,87],[-114,129,85],[106,155,91],[317,142,85],[533,160,93],[752,104,88]]}
];

function makeRidge({front,depth,width,phase,base,peak,summits},material){
  const columns=220,rows=26,positions=[],colors=[],indices=[];
  const footColor=new T.Color(base),peakColor=new T.Color(peak),color=new T.Color();
  for(let j=0;j<=rows;j++){
    const v=j/rows;
    const profile=Math.sin(Math.PI*v)**1.35;
    for(let i=0;i<=columns;i++){
      const x=(i/columns-.5)*width;
      const foothill=Math.sin(x*.023+phase);
      const z=front-depth*v+(foothill*12+Math.sin(x*.011-phase)*16)*profile;
      let height=10;
      for(const [center,elevation,radius] of summits){
        const distance=x-center;
        const slopeWidth=radius*(distance<0?.82:1.16);
        height+=elevation*Math.exp(-((Math.abs(distance)/slopeWidth)**1.62));
      }
      const ribs=Math.sin(x*.081-v*7.8+phase)*4.2+Math.sin(x*.137+v*15)*1.65;
      const crest=1+Math.sin(x*.054+phase)*.042+Math.sin(x*.122-phase)*.026;
      const ravine=Math.pow(Math.max(0,Math.sin(x*.033+v*5+phase)),5)*5;
      const y=-.4+Math.max(0,height*crest+ribs-ravine+foothill*2)*profile;
      positions.push(x,y,z);
      color.copy(footColor).lerp(peakColor,Math.min(.84,.12+y*.006));
      const canopy=Math.sin(x*.63+z*.18)*Math.cos(z*.54-x*.22);
      const strata=Math.sin(x*.1+z*.16+y*.23);
      color.multiplyScalar(1+canopy*.035+strata*.027+Math.sin(x*.038+v*11)*.032);
      colors.push(color.r,color.g,color.b);
    }
  }
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
    const a=j*(columns+1)+i,b=a+1,c=a+columns+1,d=c+1;
    indices.push(a,b,c,b,d,c);
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals=geometry.getAttribute('normal'),pigment=geometry.getAttribute('color');
  const stoneColor=peakColor.clone().lerp(new T.Color('#c1b69e'),.22);
  for(let i=0;i<pigment.count;i++){
    const steepness=Math.max(0,.77-normals.getY(i));
    color.fromBufferAttribute(pigment,i).lerp(stoneColor,steepness*.24);
    pigment.setXYZ(i,color.r,color.g,color.b);
  }
  return new T.Mesh(geometry,material);
}

export function buildMountainBackdrop(scene){
  const material=new T.MeshLambertMaterial({vertexColors:true});
  for(const ridge of RIDGES)scene.add(makeRidge(ridge,material));

  // Continue the horizon around the valley so a wide camera pan has no flat edge.
  const shoulders=[
    {heading:Math.PI/2,front:-181,ridge:RIDGES[0],height:.74},
    {heading:Math.PI/2,front:-284,ridge:RIDGES[1],height:.84},
    {heading:-Math.PI/2,front:-252,ridge:RIDGES[1],height:.79},
    {heading:Math.PI,front:-293,ridge:RIDGES[2],height:.7}
  ];
  for(const {heading,front,ridge,height} of shoulders){
    const shoulder=makeRidge({...ridge,front,phase:ridge.phase+heading},material);
    shoulder.rotation.y=heading;
    shoulder.scale.y=height;
    scene.add(shoulder);
  }
  return RIDGES.length+shoulders.length;
}
