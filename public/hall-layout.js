// Main hall dimensions and furnishings shared by Three.js and movement validation.
export const HALL={centerZ:-19.8,scaleX:3.15,scaleY:1.64,scaleZ:3.7,stairHalfWidth:21,stairFront:5};
export const HALL_DECK={
 halfWidth:9*HALL.scaleX,front:HALL.centerZ+5.05*HALL.scaleZ,
 back:HALL.centerZ-5.45*HALL.scaleZ,height:.96*HALL.scaleY
};
export const HALL_COLUMNS=[-8,-4,0,4,8].flatMap(x=>[-4.7,4.7]
 .filter(z=>x!==0||z<0).map(z=>[x*HALL.scaleX,HALL.centerZ+z*HALL.scaleZ]));
export const HALL_ALTAR={x:0,z:-35.7,width:20,depth:6.1};
export const HALL_INCENSE={x:0,z:-30.6};
export const HALL_FISH={x:16.7,z:-32.4,scale:2.2};
export const HALL_FISHES=[HALL_FISH,{x:-16.7,z:-32.4,scale:1.8}];
export const HALL_CHESTS=[-24,24].map(x=>({x,z:-9.4,width:1.55,depth:1.14}));
export const HALL_MONKS=[-1,1].flatMap(side=>[{x:side*10.8,z:-30.4,seated:true},{x:side*22.4,z:-28.1,seated:false}]);

export const HALL_GARDEN_SEATS=[{id:'garden:left',x:-25,z:6},{id:'garden:right',x:25,z:6}];
// Preserve the original cushion IDs while adding a second set of columns.
const columns=[2,5,8,12.6,16,3.5,6.5,10.3,14.3,19.4].flatMap(x=>[-x,x]);
const rows=[-5.3,-8.4,-10.4,-12.4,-14.4,-16.4,-18.4,-20.4,-22.4,-24.4];
export const HALL_SEATS=rows.flatMap(z=>columns.map(x=>({id:`hall:${x}:${z}`,x,z})));
export const HALL_ARRIVALS=HALL_SEATS.map(({x,z})=>({x,z:Math.round((z+.9)*100)/100}));
export function onHallDeck(x,z){
 return Math.abs(x)<=HALL_DECK.halfWidth&&z>=HALL_DECK.back&&z<=HALL_DECK.front;
}
