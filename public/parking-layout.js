// Positions are shared by the scene and the server's movement validation.
export const PARKING_LOT={x:83,z:52,width:28.8,depth:27};
export const CAR_SIZES={
 limousine:{width:2.08,length:5.55},
 wedge:{width:2.01,length:4.6},
 gt:{width:1.98,length:4.7},
 sedan:{width:1.84,length:4.65},
 suv:{width:1.99,length:4.87},
};
const lineup=[
 ['sedan','#b5babe'],['limousine','#222833'],['wedge','#b62924'],['gt','#d4942f'],null,
 ['suv','#505d47'],['sedan','#25476a'],['gt','#53606b'],['wedge','#d8d4c3'],['suv','#b8af9e'],
 ['suv','#dedbd5'],['gt','#326963'],['wedge','#2448a0'],['sedan','#584448'],['suv','#333c42'],
 ['gt','#a13936'],null,['sedan','#b3a388'],['suv','#2a526b'],['wedge','#db682e'],
];
export const PARKED_CARS=lineup.flatMap((entry,index)=>{
 if(!entry)return [];
 const [style,color]=entry;
 const {width,length}=CAR_SIZES[style];
 const row=Math.floor(index/10);
 return [{style,color,width,length,x:PARKING_LOT.x+(index%10-4.5)*2.72,z:PARKING_LOT.z+(row*2-1)*8.5,yaw:row*Math.PI}];
});
export const PARKING_LAMPS=[70.3,83,95.7].flatMap(x=>[39.4,64.6].map(z=>[x,z]));
export const PARKING_SIGN={x:69.2,z:55.3};

// Two open bays share the same aisle. The entrance is beyond the east cloister.
export const PARKING_DRIVE={start:151,firstStart:111,z:PARKING_LOT.z,radius:3.8};
export const ARRIVING_CARS=[
 {style:'gt',color:'#407e86',x:81.64,z:43.5,side:-1},
 {style:'wedge',color:'#c24a28',x:87.08,z:60.5,side:1},
].map(car=>({...car,...CAR_SIZES[car.style]}));
